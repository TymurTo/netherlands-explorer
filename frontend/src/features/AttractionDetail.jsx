import CommentsSection from './CommentsSection.jsx';
export default function AttractionDetail({
  item,
  city,
  user,
  saved,
  onFavorite,
  onLogin,
  favoriteBusy,
}) {
  return (
    <div className="detail">
      <div className="detail-hero">
        <img
          src={item.image}
          alt={item.image_is_placeholder ? 'Illustration of town houses' : item.name}
        />
        <div>
          <p className="eyebrow">{city.name}</p>
          <h3>{item.native_name}</h3>
          <p>{item.description}</p>
        </div>
      </div>
      {item.image_is_placeholder && (
        <p className="muted small">
          Placeholder illustration. A real photo can be added to the catalog.
        </p>
      )}
      <div className="actions">
        <button
          disabled={favoriteBusy}
          className={`${saved ? 'saved' : ''} shine-button`}
          onClick={() => onFavorite(item.id)}
        >
          {saved ? '★ Saved' : '☆ Save to favorites'}
        </button>
        <a href={item.source_url} target="_blank" rel="noreferrer">
          Official website
        </a>
      </div>
      <CommentsSection attractionId={item.id} user={user} onLogin={onLogin} />
    </div>
  );
}
