import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownContent } from './MarkdownContent';

describe('MarkdownContent component', () => {
  it('renders headings properly without raw markdown hashes', () => {
    render(<MarkdownContent content="### What is Java?" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('What is Java?');
    expect(heading.textContent).not.toContain('###');
  });

  it('renders bold and italic formatting without raw asterisks', () => {
    const { container } = render(
      <MarkdownContent content="**Java** is a *general-purpose* programming language." />
    );
    const strong = container.querySelector('strong');
    const em = container.querySelector('em');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('Java');
    expect(em).toBeInTheDocument();
    expect(em?.textContent).toBe('general-purpose');
    expect(container.textContent).not.toContain('**');
  });

  it('renders bullet lists and numbered lists properly', () => {
    const listContent = `
- Object-oriented
- Strongly typed
- Platform independent

Steps:

1. Learn variables
2. Learn OOP
3. Learn collections
`;
    const { container } = render(<MarkdownContent content={listContent} />);
    const ul = container.querySelector('ul');
    const ol = container.querySelector('ol');
    const listItems = container.querySelectorAll('li');

    expect(ul).toBeInTheDocument();
    expect(ol).toBeInTheDocument();
    expect(listItems.length).toBe(6);
    expect(listItems[0].textContent).toBe('Object-oriented');
    expect(listItems[3].textContent).toBe('Learn variables');
  });

  it('renders fenced code blocks with language badge and code text', () => {
    const codeMarkdown = `
Example:

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
\`\`\`
`;
    const { container } = render(<MarkdownContent content={codeMarkdown} />);
    expect(container.textContent).toContain('JAVA');
    expect(container.textContent).toContain('System.out.println("Hello World");');
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('renders inline code with custom styling', () => {
    const { container } = render(
      <MarkdownContent content="Use `System.out.println()` for console output." />
    );
    const inlineCode = container.querySelector('code');
    expect(inlineCode).toBeInTheDocument();
    expect(inlineCode?.textContent).toBe('System.out.println()');
  });

  it('renders links with secure attributes', () => {
    const { container } = render(
      <MarkdownContent content="Learn more at [Documentation](https://docs.oracle.com/en/java/)." />
    );
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('href')).toBe('https://docs.oracle.com/en/java/');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });

  it('renders natural plain responses without errors', () => {
    render(<MarkdownContent content="Hello! How can I help you learn Java?" />);
    expect(
      screen.getByText('Hello! How can I help you learn Java?')
    ).toBeInTheDocument();
  });

  it('renders full complex example specified by user', () => {
    const complexMarkdown = `
### What is Java?

**Java** is a general-purpose programming language.

- Object-oriented
- Strongly typed
- Platform independent

Steps:

1. Learn variables
2. Learn OOP
3. Learn collections

Example:

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
\`\`\`
`;
    const { container } = render(<MarkdownContent content={complexMarkdown} />);

    // Heading
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading.textContent).toBe('What is Java?');

    // Bold text
    const strong = container.querySelector('strong');
    expect(strong?.textContent).toBe('Java');

    // Lists
    const ul = container.querySelector('ul');
    const ol = container.querySelector('ol');
    expect(ul).toBeInTheDocument();
    expect(ol).toBeInTheDocument();

    // Code
    expect(container.textContent).toContain('JAVA');
    expect(container.textContent).toContain('public class Main');
  });

  it('handles malformed markdown gracefully', () => {
    const malformed = '### Incomplete heading without proper formatting \n\n**unclosed bold \n\n```unclosed code';
    const { container } = render(<MarkdownContent content={malformed} />);
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain('Incomplete heading');
  });
});
