/**
 * DevPrep - Code Editor Keyboard & Formatting Utilities (`codeEditorUtils.js`)
 * 
 * Provides IDE-like typing mechanics for standard HTML <textarea> elements:
 * 
 * 1. Native Undo/Redo Preservation:
 *    - Instead of directly assigning `textarea.value = newVal` (which destroys the browser's
 *      undo/redo history stack), `document.execCommand('insertText', false, text)` is used.
 *    - This pushes atomic edit steps directly to the browser's native Undo manager (Ctrl+Z / Ctrl+Y),
 *      and dispatches the native 'input' event to keep React's state perfectly synchronized.
 * 
 * 2. Smart Indentation:
 *    - Tab inserts 4 spaces at cursor position.
 *    - Multi-line Tab indents all selected lines by 4 spaces.
 *    - Shift+Tab unindents the current line or all selected lines by up to 4 spaces.
 * 
 * 3. Contextual Enter:
 *    - Automatically retains the leading indentation of the active line.
 *    - Adds an extra indent level (4 spaces) if the line ends with an opening brace/bracket ('{', '[', '(').
 *    - If pressed between a matching pair (e.g. `{|}`), expands to a 3-line block:
 *      indented newline + cursor, followed by closing brace on its own line.
 * 
 * 4. Auto-Closing & Type-Over:
 *    - Automatically pairs brackets `()`, `[]`, `{}` and quotes `""`, `''`, ````.
 *    - Skips duplicate closers if the user types a closer that is already the next character.
 *    - Prevents quote auto-close when typing right after a letter or digit (e.g. `it's`).
 *    - Wraps highlighted text when an opener is typed over an active selection.
 * 
 * 5. Backspace on Empty Pairs:
 *    - Deletes both characters when Backspace is pressed between an empty pair (e.g. `(|)`).
 * 
 * 6. Accessibility & Productivity Shortcuts:
 *    - Ctrl/Cmd + Enter: Trigger test runner.
 *    - Ctrl/Cmd + S: Save note / solution (prevents browser "Save Page" dialog).
 *    - Escape: Moves focus out of the textarea so keyboard/screen-reader users can escape the tab trap.
 */

const PAIRS = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`'
};

const OPENERS = new Set(['(', '[', '{', '"', "'", '`']);
const CLOSERS = new Set([')', ']', '}', '"', "'", '`']);

/**
 * Inserts text into the textarea while preserving the native browser undo stack.
 * Falls back to setRangeText if execCommand is unavailable.
 * 
 * @param {HTMLTextAreaElement} textarea - Target DOM textarea
 * @param {string} text - Text to insert or replace selection with
 * @param {number|null} cursorOffset - Explicit cursor offset position after insertion
 */
export function insertTextWithUndo(textarea, text, cursorOffset = null) {
  textarea.focus();
  let executed = false;
  try {
    // document.execCommand('insertText') registers an undoable action in Blink, Gecko, and WebKit
    executed = document.execCommand('insertText', false, text);
  } catch (_) {
    executed = false;
  }

  // Fallback in environments where execCommand is disabled
  if (!executed) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(text, start, end, 'end');
    // Dispatch input event to notify React's onChange handler
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  if (cursorOffset !== null) {
    textarea.setSelectionRange(cursorOffset, cursorOffset);
  }
}

/**
 * Calculates 1-based Line and Column coordinates from cursor character index.
 * 
 * @param {string} text - Full textarea text
 * @param {number} cursorIndex - Cursor offset
 * @returns {{ line: number, col: number }}
 */
export function getCursorLineCol(text, cursorIndex) {
  if (!text) return { line: 1, col: 1 };
  const safeIndex = Math.min(Math.max(0, cursorIndex || 0), text.length);
  const textBefore = text.slice(0, safeIndex);
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

/**
 * Main onKeyDown orchestrator for the code editor textarea.
 * 
 * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - Keyboard event
 * @param {object} options - Callbacks and metadata
 * @param {Function} [options.onRunTests] - Called on Ctrl/Cmd + Enter
 * @param {Function} [options.onSave] - Called on Ctrl/Cmd + S
 */
export function handleEditorKeyDown(e, { onRunTests, onSave } = {}) {
  const textarea = e.currentTarget;
  const { selectionStart: selStart, selectionEnd: selEnd, value: text } = textarea;
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  // 1. Shortcut: Ctrl/Cmd + Enter -> Run Tests
  if (modifier && e.key === 'Enter') {
    e.preventDefault();
    if (typeof onRunTests === 'function') {
      onRunTests();
    }
    return;
  }

  // 2. Shortcut: Ctrl/Cmd + S -> Save Solution Note
  if (modifier && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    if (typeof onSave === 'function') {
      onSave();
    }
    return;
  }

  // 3. Accessibility Shortcut: Escape -> Exit editor focus trap
  if (e.key === 'Escape') {
    e.preventDefault();
    textarea.blur();
    return;
  }

  // 4. Tab / Shift+Tab -> Indent or Unindent
  if (e.key === 'Tab') {
    e.preventDefault();
    const hasSelection = selStart !== selEnd;
    const isMultiLine = hasSelection && text.substring(selStart, selEnd).includes('\n');

    // Case A: Multi-line selection or Shift+Tab with active selection
    if (isMultiLine || (hasSelection && e.shiftKey)) {
      const firstLineStart = text.lastIndexOf('\n', selStart - 1) + 1;
      let lastLineEnd = text.indexOf('\n', selEnd);
      if (lastLineEnd === -1) lastLineEnd = text.length;

      const targetBlock = text.substring(firstLineStart, lastLineEnd);
      const lines = targetBlock.split('\n');

      if (e.shiftKey) {
        // Shift+Tab: Unindent each line by up to 4 spaces or 1 tab
        let firstLineRemoved = 0;
        let totalRemoved = 0;

        const unindentedLines = lines.map((line, i) => {
          let spacesToRemove = 0;
          while (spacesToRemove < 4 && line[spacesToRemove] === ' ') {
            spacesToRemove++;
          }
          if (spacesToRemove === 0 && line[0] === '\t') {
            spacesToRemove = 1;
          }
          if (i === 0) firstLineRemoved = spacesToRemove;
          totalRemoved += spacesToRemove;
          return line.substring(spacesToRemove);
        });

        textarea.setSelectionRange(firstLineStart, lastLineEnd);
        insertTextWithUndo(textarea, unindentedLines.join('\n'));
        textarea.setSelectionRange(
          Math.max(firstLineStart, selStart - firstLineRemoved),
          Math.max(firstLineStart, selEnd - totalRemoved)
        );
      } else {
        // Tab: Indent each line by 4 spaces
        const indentedLines = lines.map((line) => '    ' + line);
        textarea.setSelectionRange(firstLineStart, lastLineEnd);
        insertTextWithUndo(textarea, indentedLines.join('\n'));
        textarea.setSelectionRange(
          selStart + 4,
          selEnd + 4 * lines.length
        );
      }
      return;
    }

    // Case B: Single line Shift+Tab (Unindent current line)
    if (e.shiftKey) {
      const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
      const match = text.substring(lineStart).match(/^( {1,4}|\t)/);
      if (match) {
        const spacesToRemove = match[0].length;
        textarea.setSelectionRange(lineStart, lineStart + spacesToRemove);
        insertTextWithUndo(textarea, '');
        const newPos = Math.max(lineStart, selStart - spacesToRemove);
        textarea.setSelectionRange(newPos, newPos);
      }
      return;
    }

    // Case C: Single line Tab -> Insert 4 spaces
    insertTextWithUndo(textarea, '    ');
    return;
  }

  // 5. Enter -> Contextual Indentation & Brace Expansion
  if (e.key === 'Enter') {
    e.preventDefault();
    const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
    const lineBefore = text.substring(lineStart, selStart);
    const indentMatch = lineBefore.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0] : '';

    const charBefore = text[selStart - 1];
    const charAfter = text[selEnd];

    // Check if Enter was pressed between matching open and close brackets: {|} or [|] or (|)
    const isBetweenPair =
      (charBefore === '{' && charAfter === '}') ||
      (charBefore === '[' && charAfter === ']') ||
      (charBefore === '(' && charAfter === ')');

    const trimmedBefore = lineBefore.trimEnd();
    const endsWithOpener = ['{', '[', '('].some((op) => trimmedBefore.endsWith(op));

    if (isBetweenPair) {
      // Split pair into 3 lines: \n + indent + 4 spaces + \n + indent + closer
      const extraIndent = indent + '    ';
      const insertion = '\n' + extraIndent + '\n' + indent;
      insertTextWithUndo(textarea, insertion);
      const cursorTarget = selStart + 1 + extraIndent.length;
      textarea.setSelectionRange(cursorTarget, cursorTarget);
    } else if (endsWithOpener) {
      // Add extra indent after line ending with opener
      const extraIndent = indent + '    ';
      insertTextWithUndo(textarea, '\n' + extraIndent);
    } else {
      // Retain standard line indentation
      insertTextWithUndo(textarea, '\n' + indent);
    }
    return;
  }

  // 6. Backspace -> Delete Matching Empty Pair
  if (e.key === 'Backspace' && selStart === selEnd && selStart > 0) {
    const prevChar = text[selStart - 1];
    const nextChar = text[selStart];
    if (PAIRS[prevChar] && PAIRS[prevChar] === nextChar) {
      e.preventDefault();
      // Select both characters and delete cleanly with native undo support
      textarea.setSelectionRange(selStart - 1, selStart + 1);
      insertTextWithUndo(textarea, '');
      return;
    }
  }

  // 7. Type-Over Existing Closer
  if (CLOSERS.has(e.key) && selStart === selEnd && text[selStart] === e.key) {
    // If the next character is already the closer typed, step over it without duplicating
    e.preventDefault();
    textarea.setSelectionRange(selStart + 1, selStart + 1);
    return;
  }

  // 8. Auto-Closing & Selection Wrapping
  if (OPENERS.has(e.key)) {
    const isQuote = e.key === '"' || e.key === "'" || e.key === '`';

    // Case A: Text is selected -> Wrap selection in matching pair
    if (selStart !== selEnd) {
      e.preventDefault();
      const selectedContent = text.substring(selStart, selEnd);
      const closer = PAIRS[e.key];
      const wrapped = e.key + selectedContent + closer;
      insertTextWithUndo(textarea, wrapped);
      // Keep wrapped text selected inside the new brackets
      textarea.setSelectionRange(selStart + 1, selEnd + 1);
      return;
    }

    // Case B: No selection -> Check quote contraction guardrail
    if (isQuote) {
      const prevChar = text[selStart - 1];
      // Do not auto-close quote immediately following a letter or digit (e.g. contractions: it's, don't)
      if (prevChar && /[a-zA-Z0-9_]/.test(prevChar)) {
        return; // Allow native typing of lone quote
      }
    }

    // Auto-close pair and place cursor in between
    e.preventDefault();
    const closer = PAIRS[e.key];
    insertTextWithUndo(textarea, e.key + closer);
    textarea.setSelectionRange(selStart + 1, selStart + 1);
  }
}
