import type { ReactNode } from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { copyText } from '../../utils/clipboard';
import { openInGitHub } from './api';
import { tagUrl } from './status';
import type { IssueOrPull, Member, Release, Repo, RepoCi, Tag, Team } from './types';

export function RepoContextMenu({ repo }: { repo: Repo & { ci?: RepoCi } }) {
  return (
    <>
      <ContextItem onClick={() => openInGitHub(repo.html_url)}>Open on GitHub</ContextItem>
      {repo.ci?.url && <ContextItem onClick={() => openInGitHub(repo.ci!.url!)}>Open latest CI run</ContextItem>}
      <ContextMenu.Separator className="contextMenuSeparator" />
      <CopySubmenu>
        <ContextItem onClick={() => copyText(repo.name)}>Repo name</ContextItem>
        <ContextItem onClick={() => copyText(repo.full_name)}>Full name</ContextItem>
        <ContextItem onClick={() => copyText(repo.html_url)}>URL</ContextItem>
      </CopySubmenu>
    </>
  );
}

export function TeamContextMenu({ team }: { team: Team }) {
  return (
    <>
      <ContextItem onClick={() => openInGitHub(team.html_url)}>Open on GitHub</ContextItem>
      <ContextMenu.Separator className="contextMenuSeparator" />
      <CopySubmenu>
        <ContextItem onClick={() => copyText(team.name)}>Team name</ContextItem>
        <ContextItem onClick={() => copyText(team.slug)}>Slug</ContextItem>
        <ContextItem onClick={() => copyText(team.html_url)}>URL</ContextItem>
      </CopySubmenu>
    </>
  );
}

export function MemberContextMenu({ member }: { member: Member }) {
  return (
    <>
      <ContextItem onClick={() => openInGitHub(member.html_url)}>Open on GitHub</ContextItem>
      <ContextMenu.Separator className="contextMenuSeparator" />
      <CopySubmenu>
        <ContextItem onClick={() => copyText(member.login)}>Login</ContextItem>
        <ContextItem onClick={() => copyText(member.html_url)}>URL</ContextItem>
      </CopySubmenu>
    </>
  );
}

export function IssueContextMenu({ item }: { item: IssueOrPull }) {
  return (
    <>
      <ContextItem onClick={() => openInGitHub(item.html_url)}>Open on GitHub</ContextItem>
      <ContextMenu.Separator className="contextMenuSeparator" />
      <CopySubmenu>
        <ContextItem onClick={() => copyText(`#${item.number}`)}>#{item.number}</ContextItem>
        <ContextItem onClick={() => copyText(item.title)}>Title</ContextItem>
        <ContextItem onClick={() => copyText(item.html_url)}>URL</ContextItem>
        {item.user?.login && <ContextItem onClick={() => copyText(item.user!.login)}>Author</ContextItem>}
      </CopySubmenu>
    </>
  );
}

export function ReleaseContextMenu({ release }: { release: Release }) {
  return (
    <>
      <ContextItem onClick={() => openInGitHub(release.html_url)}>Open on GitHub</ContextItem>
      <ContextMenu.Separator className="contextMenuSeparator" />
      <CopySubmenu>
        <ContextItem onClick={() => copyText(release.tag_name)}>Tag</ContextItem>
        <ContextItem onClick={() => copyText(release.name || release.tag_name)}>Name</ContextItem>
        <ContextItem onClick={() => copyText(release.html_url)}>URL</ContextItem>
      </CopySubmenu>
    </>
  );
}

export function TagContextMenu({ repo, tag }: { repo: Repo; tag: Tag }) {
  const url = tagUrl(repo, tag);

  return (
    <>
      <ContextItem onClick={() => openInGitHub(url)}>Open on GitHub</ContextItem>
      <ContextMenu.Separator className="contextMenuSeparator" />
      <CopySubmenu>
        <ContextItem onClick={() => copyText(tag.name)}>Tag</ContextItem>
        <ContextItem onClick={() => copyText(tag.commit.sha)}>Commit SHA</ContextItem>
        <ContextItem onClick={() => copyText(url)}>URL</ContextItem>
      </CopySubmenu>
    </>
  );
}

function CopySubmenu({ children }: { children: ReactNode }) {
  return (
    <ContextMenu.SubmenuRoot>
      <ContextMenu.SubmenuTrigger className="contextMenuItem contextMenuSubmenuTrigger">
        <span>Copy</span>
        <span>›</span>
      </ContextMenu.SubmenuTrigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="contextMenuPositioner" alignOffset={-4} sideOffset={-4}>
          <ContextMenu.Popup className="contextMenuPopup">{children}</ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.SubmenuRoot>
  );
}

function ContextItem({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <ContextMenu.Item className="contextMenuItem" onClick={onClick}>
      {children}
    </ContextMenu.Item>
  );
}
