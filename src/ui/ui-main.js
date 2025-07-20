import { render } from 'lit';
import './components/parkour-hero-ui.js';

const uiRoot = document.getElementById('ui-root');

if (uiRoot) {
  render(
    document.createElement('parkour-hero-ui'),
    uiRoot
  );
} else {
  console.error('UI Root element #ui-root not found. UI cannot be initialized.');
}