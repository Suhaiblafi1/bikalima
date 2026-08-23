import type { ReactNode } from "react";

type PlatformTone = "learner" | "trainer" | "family" | "admin";

export function PlatformIntro({
  eyebrow,
  title,
  description,
  icon,
  action,
  tone,
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon: ReactNode;
  action?: ReactNode;
  tone: PlatformTone;
  compact?: boolean;
}) {
  return (
    <header className={`platform-intro ${compact ? "platform-intro--compact" : ""}`} data-tone={tone}>
      <div className="platform-intro__glow" aria-hidden="true" />
      <div className="platform-intro__mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="platform-intro__content">
        <div className="platform-intro__icon" aria-hidden="true">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="platform-intro__eyebrow">{eyebrow}</p>
          <h1 className="platform-intro__title">{title}</h1>
          {description && <p className="platform-intro__description">{description}</p>}
        </div>
        {action && <div className="platform-intro__action">{action}</div>}
      </div>
    </header>
  );
}
