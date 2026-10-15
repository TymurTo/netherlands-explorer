import { useNavigation } from '../state/NavigationContext.jsx';
import {
  SearchView,
  DirectoryView,
  StoryView,
  PlacesView,
  AuthView,
  AccountView,
  AttractionView,
} from './PanelViews.jsx';
const views = {
  search: SearchView,
  directory: DirectoryView,
  story: StoryView,
  sights: PlacesView,
  favorites: PlacesView,
  auth: AuthView,
  account: AccountView,
  attraction: AttractionView,
};
export default function PanelContent() {
  const { selection } = useNavigation();
  const View = views[selection.panel?.type];
  return View ? <View /> : null;
}
