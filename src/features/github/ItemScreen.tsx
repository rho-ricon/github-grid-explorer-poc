import { Drawer } from '@base-ui/react/drawer';
import { formatDate } from './status';
import type { IssueOrPull, Repo } from './types';

export function ItemScreen({ repo, item }: { repo: Repo; item: IssueOrPull }) {
  const kind = item.pull_request ? 'PR' : 'Issue';

  return (
    <Drawer.Content className="screen">
      <header className="topbar">
        <Drawer.Close className="back">← Back</Drawer.Close>
        <Drawer.Title>
          {repo.name} / {kind} #{item.number}
        </Drawer.Title>
        <span>{item.state}</span>
      </header>

      <main className="center detail">
        <h2>{item.title}</h2>
        <p>{item.comments} comments</p>
        <p>Updated {formatDate(item.updated_at)}</p>
        <a className="back" href={item.html_url} target="_blank" rel="noreferrer">
          Open on GitHub
        </a>
      </main>
    </Drawer.Content>
  );
}
