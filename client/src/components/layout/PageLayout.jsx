import { TopNav } from './TopNav.jsx';
import { useTheme } from '../../hooks/useTheme.js';

export function PageLayout({ children }) {
  useTheme();

  return (
    <div className="page-layout">
      <TopNav />
      <main className="page-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
