import React from 'react';

interface SSRHeadScriptsProps {
  rawHtml?: string;
  isEnabled?: boolean;
}

export const SSRHeadScripts: React.FC<SSRHeadScriptsProps> = ({ rawHtml, isEnabled = true }) => {
  if (!isEnabled || !rawHtml || !rawHtml.trim()) return null;

  const elements: React.ReactNode[] = [];
  let idx = 0;

  // 1. Extract and render all <script ...>...</script> and <script .../>
  const scriptRegex = /<script\b([^>]*?)(?:>([\s\S]*?)<\/script>|\/>)/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(rawHtml)) !== null) {
    const rawAttrs = match[1] || '';
    const content = match[2] || '';

    const srcMatch = rawAttrs.match(/src=["']([^"']+)["']/i);
    const typeMatch = rawAttrs.match(/type=["']([^"']+)["']/i);
    const isDefer = /\bdefer\b/i.test(rawAttrs);

    if (srcMatch && srcMatch[1]) {
      const srcUrl = srcMatch[1];
      // In React 19 and modern browsers, external head scripts should be async
      // to avoid parser-blocking DOM mutations during initial HTML streaming,
      // and to allow React 19's native resource manager to track them by src.
      elements.push(
        <script
          key={`ssr-ext-${srcUrl}-${idx++}`}
          src={srcUrl}
          async={isDefer ? undefined : true}
          defer={isDefer ? true : undefined}
          type={typeMatch ? typeMatch[1] : undefined}
          suppressHydrationWarning={true}
          data-streamespn-head-script="true"
        />
      );
    } else if (content && content.trim()) {
      elements.push(
        <script
          key={`ssr-inline-${idx++}`}
          type={typeMatch ? typeMatch[1] : 'text/javascript'}
          dangerouslySetInnerHTML={{ __html: content }}
          suppressHydrationWarning={true}
          data-streamespn-head-script="true"
        />
      );
    }
  }

  // 2. Extract and render all <meta ...>
  const metaRegex = /<meta\b([^>]*)\/?>/gi;
  while ((match = metaRegex.exec(rawHtml)) !== null) {
    const rawAttrs = match[1];
    const nameMatch = rawAttrs.match(/name=["']([^"']+)["']/i);
    const contentMatch = rawAttrs.match(/content=["']([^"']+)["']/i);
    const propertyMatch = rawAttrs.match(/property=["']([^"']+)["']/i);
    elements.push(
      <meta
        key={`ssr-meta-${idx++}`}
        name={nameMatch ? nameMatch[1] : undefined}
        content={contentMatch ? contentMatch[1] : undefined}
        property={propertyMatch ? propertyMatch[1] : undefined}
        suppressHydrationWarning={true}
        data-streamespn-head-script="true"
      />
    );
  }

  // 3. Extract and render all <link ...>
  const linkRegex = /<link\b([^>]*)\/?>/gi;
  while ((match = linkRegex.exec(rawHtml)) !== null) {
    const rawAttrs = match[1];
    const relMatch = rawAttrs.match(/rel=["']([^"']+)["']/i);
    const hrefMatch = rawAttrs.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      elements.push(
        <link
          key={`ssr-link-${idx++}`}
          rel={relMatch ? relMatch[1] : 'stylesheet'}
          href={hrefMatch[1]}
          suppressHydrationWarning={true}
          data-streamespn-head-script="true"
        />
      );
    }
  }

  return <>{elements}</>;
};

