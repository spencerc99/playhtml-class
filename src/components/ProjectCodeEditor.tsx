// ABOUTME: Ace-powered HTML and CSS editor for a project's shared object.
// ABOUTME: Keeps separate undo histories while syncing every change live.

import { createEditSession, edit, type Ace } from 'ace-builds';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-tomorrow_night_eighties';
import { useEffect, useRef, useState } from 'react';

type CodeLanguage = 'css' | 'html';

interface ProjectCodeEditorProps {
  css: string;
  html: string;
  onChange: (language: CodeLanguage, value: string) => void;
}

type EditorSessions = Record<CodeLanguage, Ace.EditSession>;

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  html: 'HTML',
  css: 'CSS',
};

export default function ProjectCodeEditor({
  css,
  html,
  onChange,
}: ProjectCodeEditorProps) {
  const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('html');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Ace.Editor | null>(null);
  const sessionsRef = useRef<EditorSessions | null>(null);
  const applyingExternalValue = useRef(false);
  const initialValues = useRef({ css, html });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sessions: EditorSessions = {
      html: createEditSession(initialValues.current.html),
      css: createEditSession(initialValues.current.css),
    };
    sessions.html.setMode('ace/mode/html');
    sessions.css.setMode('ace/mode/css');

    for (const session of Object.values(sessions)) {
      session.setUseWorker(false);
      session.setUseSoftTabs(true);
      session.setTabSize(2);
      session.setUseWrapMode(true);
    }

    const editor = edit(container, {
      animatedScroll: true,
      behavioursEnabled: true,
      displayIndentGuides: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: false,
      enableSnippets: true,
      fontSize: 13,
      highlightActiveLine: true,
      highlightSelectedWord: true,
      scrollPastEnd: 0.35,
      showFoldWidgets: true,
      showGutter: true,
      showLineNumbers: true,
      showPrintMargin: false,
      tabSize: 2,
      useSoftTabs: true,
      useWorker: false,
      wrap: true,
    });
    editor.setTheme('ace/theme/tomorrow_night_eighties');
    editor.setSession(sessions.html);
    editor.renderer.setPadding(12);
    editor.renderer.setScrollMargin(10, 10);
    editor.textInput.getElement().setAttribute('aria-label', 'HTML code');

    const emitHtml = () => {
      if (!applyingExternalValue.current) {
        onChangeRef.current('html', sessions.html.getValue());
      }
    };
    const emitCss = () => {
      if (!applyingExternalValue.current) {
        onChangeRef.current('css', sessions.css.getValue());
      }
    };

    sessions.html.on('change', emitHtml);
    sessions.css.on('change', emitCss);
    sessionsRef.current = sessions;
    editorRef.current = editor;

    const resizeObserver = new ResizeObserver(() => editor.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      sessions.html.off('change', emitHtml);
      sessions.css.off('change', emitCss);
      editor.destroy();
      container.replaceChildren();
      editorRef.current = null;
      sessionsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const session = sessionsRef.current?.[activeLanguage];
    if (!editor || !session) return;

    editor.setSession(session);
    editor.textInput
      .getElement()
      .setAttribute('aria-label', `${LANGUAGE_LABELS[activeLanguage]} code`);
    editor.resize();
    editor.focus();
  }, [activeLanguage]);

  useEffect(() => {
    const session = sessionsRef.current?.html;
    if (!session || session.getValue() === html) return;

    applyingExternalValue.current = true;
    session.setValue(html);
    applyingExternalValue.current = false;
  }, [html]);

  useEffect(() => {
    const session = sessionsRef.current?.css;
    if (!session || session.getValue() === css) return;

    applyingExternalValue.current = true;
    session.setValue(css);
    applyingExternalValue.current = false;
  }, [css]);

  const activeValue = activeLanguage === 'html' ? html : css;
  const lineCount = activeValue.split('\n').length;

  return (
    <section className="project-code-editor" aria-label="Object code editor">
      <div className="project-code-editor__toolbar">
        <div className="project-code-editor__tabs" role="tablist">
          {(['html', 'css'] as const).map((language) => (
            <button
              aria-controls="project-code-editor-surface"
              aria-selected={activeLanguage === language}
              className={activeLanguage === language ? 'is-active' : ''}
              key={language}
              onClick={() => setActiveLanguage(language)}
              role="tab"
              type="button"
            >
              {LANGUAGE_LABELS[language]}
            </button>
          ))}
        </div>
        <span className="project-code-editor__state">
          <i aria-hidden="true" /> Draft
        </span>
      </div>

      <div
        className="project-code-editor__surface"
        id="project-code-editor-surface"
        ref={containerRef}
        role="tabpanel"
      />

      <footer className="project-code-editor__footer">
        <span>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} ·{' '}
          {activeValue.length} characters
        </span>
        <span>
          <kbd>⌘F</kbd> find · <kbd>⌘Z</kbd> undo
        </span>
      </footer>
    </section>
  );
}
