import { GitHubAuthProvider } from './features/github/auth';
import { GitHubExplorer } from './features/github/GitHubExplorer';

export default function App() {
  return (
    <GitHubAuthProvider>
      <GitHubExplorer />
    </GitHubAuthProvider>
  );
}
