import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
  className?: string
}

export default function MarkdownContent({ content, className = '' }: Props) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', textDecoration: 'underline' }}>
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            return isBlock ? (
              <pre style={{ background: '#0f172a', padding: '8px 12px', borderRadius: 8, overflowX: 'auto', margin: '6px 0' }}>
                <code style={{ color: '#c4b5fd', fontSize: 12, fontFamily: 'monospace' }}>{children}</code>
              </pre>
            ) : (
              <code style={{ background: '#0f172a', color: '#c4b5fd', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace' }}>
                {children}
              </code>
            )
          },
          ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '4px 0', listStyleType: 'disc' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '4px 0', listStyleType: 'decimal' }}>{children}</ol>,
          li: ({ children }) => <li style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{children}</li>,
          p: ({ children }) => <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6, margin: '4px 0' }}>{children}</p>,
          strong: ({ children }) => <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>{children}</strong>,
          em: ({ children }) => <em style={{ color: '#94a3b8' }}>{children}</em>,
          h1: ({ children }) => <h1 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 700, margin: '8px 0 4px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, margin: '6px 0 4px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, margin: '4px 0 2px' }}>{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid #4c1d95', paddingLeft: 10, margin: '6px 0', color: '#94a3b8', fontStyle: 'italic' }}>
              {children}
            </blockquote>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid #1e293b', margin: '8px 0' }} />,
          input: ({ checked }) => (
            <input type="checkbox" checked={checked} readOnly
              style={{ marginRight: 6, accentColor: '#8b5cf6' }} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
