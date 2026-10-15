import { useNavigation } from '../state/NavigationContext.jsx';
import Modal from '../components/Modal.jsx';
import PanelContent from './PanelContent.jsx';
export default function AtlasDrawer() {
  const { selection, closePanel } = useNavigation();
  const { panel, province, city, attraction } = selection;
  if (!panel) return null;
  const titles = {
    search: 'Find a place',
    directory: 'Provinces and cities',
    story: city?.name || province?.name || 'Your Netherlands',
    sights: 'Attractions',
    favorites: 'Favorites',
    auth: 'Your account',
    account: 'My account',
    attraction: attraction?.name,
  };
  return (
    <Modal
      key={`${panel.type}-${panel.id || ''}`}
      title={titles[panel.type]}
      side={['search', 'directory'].includes(panel.type) ? 'left' : 'right'}
      wide={['sights', 'favorites'].includes(panel.type)}
      onClose={closePanel}
    >
      <PanelContent />
    </Modal>
  );
}
