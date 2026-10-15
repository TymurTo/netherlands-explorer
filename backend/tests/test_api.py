import sqlite3
import time
import pytest
from fastapi.testclient import TestClient
from app import main
from app.core import database as database_module
from app.core.catalog_store import CATALOG

HEADERS = {"X-Atlas-Request": "1", "Origin": "http://localhost:5173"}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(database_module, "DB_PATH", tmp_path / "test.sqlite3")
    with TestClient(main.app, headers=HEADERS) as client:
        yield client


def register(client, username="traveller"):
    response = client.post(
        "/api/auth/register", json={"username": username, "password": "very-good-password"}
    )
    assert response.status_code == 201
    return response.json()


def test_full_user_flow_persistence_and_isolation(client):
    catalog = client.get("/api/catalog").json()
    assert len(catalog["provinces"]) == 12
    sight = catalog["attractions"][0]["id"]
    assert client.put(f"/api/favorites/{sight}").status_code == 401
    assert (
        client.post(f"/api/attractions/{sight}/comments", json={"body": "hello"}).status_code == 401
    )
    first = register(client)
    assert client.get("/api/auth/me").json() == first
    assert client.put(f"/api/favorites/{sight}").status_code == 204
    assert client.put(f"/api/favorites/{sight}").status_code == 204
    assert client.get("/api/favorites").json() == [sight]
    comment = client.post(
        f"/api/attractions/{sight}/comments", json={"body": "Красивое место!"}
    ).json()["id"]
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    register(client, "another_user")
    assert client.get("/api/favorites").json() == []
    assert client.delete(f"/api/comments/{comment}").status_code == 404

    assert (
        client.get(f"/api/attractions/{sight}/comments").json()["items"][0]["body"]
        == "Красивое место!"
    )
    client.post("/api/auth/logout")
    assert (
        client.post(
            "/api/auth/login", json={"username": "TRAVELLER", "password": "very-good-password"}
        ).status_code
        == 200
    )

    database_module.initialize_database()
    assert client.get("/api/favorites").json() == [sight]
    assert client.delete(f"/api/comments/{comment}").status_code == 204
    assert client.delete(f"/api/favorites/{sight}").status_code == 204
    assert client.get("/api/favorites").json() == []


def test_validation_and_security(client):
    response = client.post("/api/auth/register", json={"username": "alice", "password": "12345678"})
    assert response.status_code == 201
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "SameSite=lax" in response.headers["set-cookie"]
    assert (
        client.post(
            "/api/auth/register", json={"username": "ALICE", "password": "12345678"}
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/auth/login", json={"username": "alice", "password": "wrongpassword"}
        ).status_code
        == 401
    )
    assert (
        client.post("/api/auth/register", json={"username": "ab", "password": "short"}).status_code
        == 422
    )
    sight = CATALOG["attractions"][0]["id"]
    for body in ["   ", "x" * 2001]:
        assert (
            client.post(f"/api/attractions/{sight}/comments", json={"body": body}).status_code
            == 422
        )
    assert client.put("/api/favorites/unknown").status_code == 404
    assert client.get("/api/attractions/unknown/comments").status_code == 404
    assert (
        client.post("/api/auth/logout", headers={"Origin": "https://evil.example"}).status_code
        == 403
    )
    assert client.post("/api/auth/logout", headers={"X-Atlas-Request": ""}).status_code == 403
    with database_module.database() as db:
        password = db.execute("SELECT password_hash FROM users").fetchone()[0]
        assert password != "12345678"
        assert (
            db.execute("SELECT token_hash FROM sessions").fetchone()[0]
            != client.cookies["atlas_session"]
        )
        db.execute("UPDATE sessions SET expires_at=?", (time.time() - 1,))
    assert client.get("/api/auth/me").status_code == 401


def test_auth_rate_limit(client):
    for _ in range(20):
        assert (
            client.post(
                "/api/auth/login", json={"username": "nobody", "password": "wrongpassword"}
            ).status_code
            == 401
        )
    assert (
        client.post(
            "/api/auth/login", json={"username": "nobody", "password": "wrongpassword"}
        ).status_code
        == 429
    )


def test_catalog_relationships(client):
    data = client.get("/api/catalog").json()
    provinces = {p["id"] for p in data["provinces"]}
    cities = {c["id"]: c for c in data["cities"]}
    assert len(cities) == len(data["cities"])
    for city in cities.values():
        assert city["province_id"] in provinces
        assert city["description"] and city["history"]
    for item in data["attractions"]:
        assert item["city_id"] in cities
        assert item["province_id"] == cities[item["city_id"]]["province_id"]
        assert item["source_url"].startswith("https://")


def test_comment_cursor_survives_insertions_and_deletions(client):
    user = register(client)
    sight = CATALOG["attractions"][0]["id"]
    other_sight = CATALOG["attractions"][1]["id"]
    with database_module.database() as db:
        for index in range(65):
            db.execute(
                "INSERT INTO comments(user_id, attraction_id, body) VALUES (?,?,?)",
                (user["id"], sight, f"Comment {index}"),
            )
        db.execute(
            "INSERT INTO comments(user_id, attraction_id, body) VALUES (?,?,?)",
            (user["id"], other_sight, "Other attraction"),
        )
    first = client.get(f"/api/attractions/{sight}/comments").json()
    assert len(first["items"]) == 50
    cursor = first["next_cursor"]
    assert cursor == first["items"][-1]["id"]
    first_ids = {item["id"] for item in first["items"]}
    created = client.post(
        f"/api/attractions/{sight}/comments", json={"body": "New arrival"}
    ).json()["id"]
    client.delete(f"/api/comments/{first['items'][0]['id']}")
    client.delete(f"/api/comments/{cursor - 1}")
    second = client.get(f"/api/attractions/{sight}/comments?before={cursor}").json()
    second_ids = [item["id"] for item in second["items"]]
    assert second_ids == list(range(cursor - 2, 0, -1))
    assert not first_ids.intersection(second_ids)
    assert created not in second_ids
    assert second["next_cursor"] is None
    assert not second["has_more"]
    refreshed = client.get(f"/api/attractions/{sight}/comments").json()
    assert refreshed["items"][0]["id"] == created
    for query in ["before=0", "before=-1", "before=bad", "limit=0", "limit=101"]:
        assert client.get(f"/api/attractions/{sight}/comments?{query}").status_code == 422


@pytest.mark.parametrize(
    "peer,forwarded,limited_ip,expected",
    [
        ("10.0.0.1", "198.51.100.1", "198.51.100.1", 429),
        ("10.0.0.1", "198.51.100.2", "198.51.100.1", 401),
        ("192.0.2.10", "198.51.100.1", "198.51.100.1", 401),
        ("192.0.2.10", "198.51.100.2", "192.0.2.10", 429),
        ("10.0.0.1", "203.0.113.99, 198.51.100.1, 10.0.0.2", "198.51.100.1", 429),
    ],
)
def test_rate_limit_with_trusted_proxy(client, peer, forwarded, limited_ip, expected):
    from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

    with database_module.database() as db:
        db.executemany(
            "INSERT INTO auth_attempts VALUES (?,?)",
            [(limited_ip, time.time()) for _ in range(20)],
        )
    wrapped = ProxyHeadersMiddleware(main.app, trusted_hosts=["10.0.0.1", "10.0.0.2"])
    with TestClient(wrapped, client=(peer, 12345), headers=HEADERS) as proxied:
        response = proxied.post(
            "/api/auth/login",
            headers={"X-Forwarded-For": forwarded},
            json={"username": "nobody", "password": "wrongpassword"},
        )
        assert response.status_code == expected


def test_validation_identifies_the_field(client):
    response = client.post(
        "/api/auth/register", json={"username": "valid_user", "password": "short"}
    )
    assert response.status_code == 422
    assert {tuple(item["loc"]) for item in response.json()["detail"]} == {("body", "password")}
