import React, { useState } from 'react';
import {
  Heading,
  AlignLeft,
  Quote,
  List,
  Image as ImageIcon,
  Link,
  Table as TableIcon,
  AlertCircle,
  Code as CodeIcon,
  Minus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Eye,
  Edit3,
  LayoutGrid
} from 'lucide-react';
import type { StructuredContent, ContentBlock, ContentBlockType } from '@cms/schemas';
import { renderStructuredContent } from '@cms/utils/dist/sanitizer.js';
import { MediaPickerModal } from '../Media/MediaPickerModal.js';

interface StructuredEditorProps {
  content: StructuredContent;
  onChange: (content: StructuredContent) => void;
}

export const StructuredEditor: React.FC<StructuredEditorProps> = ({ content, onChange }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [mediaPickerBlockId, setMediaPickerBlockId] = useState<string | null>(null);

  const blocks = content.blocks || [];

  const updateBlocks = (newBlocks: ContentBlock[]) => {
    onChange({ blocks: newBlocks });
  };

  const addBlock = (type: ContentBlockType) => {
    const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let newBlock: ContentBlock;

    switch (type) {
      case 'heading':
        newBlock = { id, type: 'heading', level: 2, text: '' };
        break;
      case 'paragraph':
        newBlock = { id, type: 'paragraph', text: '' };
        break;
      case 'grid':
        newBlock = {
          id,
          type: 'grid',
          columns: 3,
          items: [
            {
              id: `item_${Date.now()}_1`,
              icon: '✨',
              badge: 'Fast',
              title: 'Feature One',
              text: 'Detail about this key highlight or offering.',
              buttonText: 'Learn More',
              buttonUrl: '#'
            },
            {
              id: `item_${Date.now()}_2`,
              icon: '🚀',
              badge: 'Scalable',
              title: 'Feature Two',
              text: 'Detail about this key highlight or offering.',
              buttonText: 'Learn More',
              buttonUrl: '#'
            },
            {
              id: `item_${Date.now()}_3`,
              icon: '🎯',
              badge: 'Reliable',
              title: 'Feature Three',
              text: 'Detail about this key highlight or offering.',
              buttonText: 'Learn More',
              buttonUrl: '#'
            }
          ]
        };
        break;
      case 'blockquote':
        newBlock = { id, type: 'blockquote', text: '', citation: '' };
        break;
      case 'list':
        newBlock = { id, type: 'list', style: 'unordered', items: [''] };
        break;
      case 'image':
        newBlock = { id, type: 'image', url: '', alt: '', caption: '' };
        break;
      case 'button':
        newBlock = { id, type: 'button', text: 'Learn More', url: '#', variant: 'primary', target: '_self' };
        break;
      case 'table':
        newBlock = {
          id,
          type: 'table',
          headers: ['Feature', 'Description'],
          rows: [['Feature 1', 'Detail description 1']]
        };
        break;
      case 'callout':
        newBlock = { id, type: 'callout', variant: 'info', title: 'Note', text: '' };
        break;
      case 'code':
        newBlock = { id, type: 'code', language: 'typescript', code: '' };
        break;
      case 'divider':
      default:
        newBlock = { id, type: 'divider' };
        break;
    }

    updateBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updated: Partial<ContentBlock>) => {
    const next = blocks.map((b) => (b.id === id ? ({ ...b, ...updated } as ContentBlock) : b));
    updateBlocks(next);
  };

  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    updateBlocks(newBlocks);
  };

  const previewHtml = renderStructuredContent(content);

  return (
    <div className="border border-surface-container-high/40 bg-surface-container-lowest rounded-xl overflow-hidden shadow-lg">
      {/* Top Toolbar */}
      <div className="p-3 bg-surface-container-low/80 border-b border-surface-container-high/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'editor' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Visual Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'preview' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Rendered Preview</span>
          </button>
        </div>

        {activeTab === 'editor' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-on-surface-variant mr-1">Insert Block:</span>
            <button
              type="button"
              onClick={() => addBlock('heading')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Heading"
            >
              <Heading className="w-3.5 h-3.5" />
              <span>Heading</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('paragraph')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Paragraph"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Text</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('grid')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1 border border-primary/30"
              title="Multi-Column Grid Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-medium">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('image')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('list')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="List"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('blockquote')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Quote</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('button')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Button"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Button</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('callout')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Callout Box"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Callout</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('table')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Table"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('code')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Code Block"
            >
              <CodeIcon className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => addBlock('divider')}
              className="p-1.5 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded text-xs flex items-center gap-1"
              title="Divider (HR)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {activeTab === 'preview' ? (
        <div className="p-8 bg-surface-container-lowest min-h-[350px]">
          <div
            className="prose max-w-none cms-rendered-content text-on-surface"
            dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-on-surface-variant italic">No content blocks yet.</p>' }}
          />
        </div>
      ) : (
        <div className="p-6 space-y-4 min-h-[350px]">
          {blocks.length === 0 ? (
            <div className="border-2 border-dashed border-surface-container-high/40 rounded-xl p-12 text-center">
              <p className="text-on-surface-variant mb-4">Content is empty. Click an option above to insert your first block.</p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => addBlock('paragraph')}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-lg text-xs"
                >
                  + Add Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('heading')}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-primary border border-primary/20 font-semibold rounded-lg text-xs"
                >
                  + Add Heading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock('grid')}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-primary border border-primary/30 font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>+ Add Grid Cards</span>
                </button>
              </div>
            </div>
          ) : (
            blocks.map((block, index) => (
              <div
                key={block.id}
                className="bg-surface-container-low border border-surface-container-high/40 rounded-lg p-4 group relative hover:border-surface-container-high/50 transition"
              >
                {/* Block header controls */}
                <div className="flex items-center justify-between mb-3 border-b border-surface-container-high/40 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container text-primary font-semibold">
                      {block.type}
                    </span>
                    {block.type === 'heading' && (
                      <select
                        value={block.level}
                        onChange={(e) => updateBlock(block.id, { level: Number(e.target.value) as any })}
                        className="bg-surface-container-lowest border border-surface-container-high/40 text-xs rounded px-2 py-0.5 text-on-surface"
                      >
                        <option value={1}>H1</option>
                        <option value={2}>H2</option>
                        <option value={3}>H3</option>
                        <option value={4}>H4</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(index, 'down')}
                      disabled={index === blocks.length - 1}
                      className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded ml-2"
                      title="Delete Block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Block Form Fields */}
                {block.type === 'heading' && (
                  <input
                    type="text"
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    placeholder="Enter heading text..."
                    className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-2 text-base font-bold text-on-surface focus:outline-none focus:border-primary"
                  />
                )}

                {block.type === 'paragraph' && (
                  <textarea
                    rows={3}
                    value={block.text}
                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                    placeholder="Type content paragraph..."
                    className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg p-3 text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                )}

                {block.type === 'blockquote' && (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Enter memorable quote..."
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg p-3 text-sm italic text-on-surface focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={block.citation || ''}
                      onChange={(e) => updateBlock(block.id, { citation: e.target.value })}
                      placeholder="Citation / Author (optional)"
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={block.url}
                        onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                        placeholder="Image URL (e.g. /media/photo.jpg)"
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerBlockId(block.id)}
                        className="px-4 py-2 bg-surface-container hover:bg-surface-container-highest text-primary border border-primary/20 rounded-lg text-xs font-semibold whitespace-nowrap"
                      >
                        Choose File
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={block.alt || ''}
                        onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                        placeholder="Alt text (for accessibility)"
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder="Caption (optional)"
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    {block.url && (
                      <div className="w-32 h-20 rounded bg-surface-container-lowest overflow-hidden border border-surface-container-high/40">
                        <img src={block.url} alt={block.alt || ''} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'list' && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4 mb-2">
                      <label className="text-xs text-on-surface-variant flex items-center space-x-1.5">
                        <input
                          type="radio"
                          name={`list_style_${block.id}`}
                          checked={block.style === 'unordered'}
                          onChange={() => updateBlock(block.id, { style: 'unordered' })}
                        />
                        <span>Bullet List</span>
                      </label>
                      <label className="text-xs text-on-surface-variant flex items-center space-x-1.5">
                        <input
                          type="radio"
                          name={`list_style_${block.id}`}
                          checked={block.style === 'ordered'}
                          onChange={() => updateBlock(block.id, { style: 'ordered' })}
                        />
                        <span>Numbered List</span>
                      </label>
                    </div>

                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center space-x-2">
                        <span className="text-xs text-on-surface-variant font-mono w-4">{itemIdx + 1}.</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...block.items];
                            newItems[itemIdx] = e.target.value;
                            updateBlock(block.id, { items: newItems });
                          }}
                          placeholder={`Item ${itemIdx + 1}`}
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded px-2.5 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = block.items.filter((_, idx) => idx !== itemIdx);
                            updateBlock(block.id, { items: newItems });
                          }}
                          className="text-on-surface-variant hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                      className="text-xs text-primary hover:underline flex items-center space-x-1 mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add list item</span>
                    </button>
                  </div>
                )}

                {block.type === 'button' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Button Label"
                      className="bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={block.url}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      placeholder="Destination URL (https://...)"
                      className="bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                    <select
                      value={block.variant}
                      onChange={(e) => updateBlock(block.id, { variant: e.target.value as any })}
                      className="bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    >
                      <option value="primary">Primary (Green)</option>
                      <option value="secondary">Secondary (Dark)</option>
                      <option value="outline">Outline</option>
                    </select>
                  </div>
                )}

                {block.type === 'callout' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={block.variant}
                        onChange={(e) => updateBlock(block.id, { variant: e.target.value as any })}
                        className="bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-xs text-on-surface"
                      >
                        <option value="info">Info (Blue)</option>
                        <option value="success">Success (Green)</option>
                        <option value="warning">Warning (Yellow)</option>
                        <option value="error">Error (Red)</option>
                      </select>
                      <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        placeholder="Callout Title"
                        className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={block.text}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Callout message..."
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded p-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.language || 'plaintext'}
                      onChange={(e) => updateBlock(block.id, { language: e.target.value })}
                      placeholder="Language (e.g. javascript, html, bash)"
                      className="w-48 bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1 text-xs font-mono text-on-surface"
                    />
                    <textarea
                      rows={4}
                      value={block.code}
                      onChange={(e) => updateBlock(block.id, { code: e.target.value })}
                      placeholder="Paste code here..."
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                {block.type === 'table' && (
                  <div className="space-y-3">
                    <div className="text-xs text-on-surface-variant">Table Headers (comma separated):</div>
                    <input
                      type="text"
                      value={(block.headers || []).join(', ')}
                      onChange={(e) => {
                        const headers = e.target.value.split(',').map((s) => s.trim());
                        updateBlock(block.id, { headers });
                      }}
                      placeholder="Column 1, Column 2, Column 3"
                      className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-sm text-on-surface"
                    />
                    <div className="text-xs text-on-surface-variant">Table Rows:</div>
                    {(block.rows || []).map((row, rowIdx) => (
                      <div key={rowIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={row.join(' | ')}
                          onChange={(e) => {
                            const newRows = [...block.rows];
                            newRows[rowIdx] = e.target.value.split('|').map((s) => s.trim());
                            updateBlock(block.id, { rows: newRows });
                          }}
                          placeholder="Value 1 | Value 2 | Value 3"
                          className="w-full bg-surface-container-lowest border border-surface-container-high/40 rounded px-3 py-1.5 text-sm text-on-surface font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newRows = block.rows.filter((_, idx) => idx !== rowIdx);
                            updateBlock(block.id, { rows: newRows });
                          }}
                          className="p-1.5 text-on-surface-variant hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { rows: [...(block.rows || []), ['Cell 1', 'Cell 2']] })}
                      className="text-xs text-primary hover:underline flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add table row</span>
                    </button>
                  </div>
                )}

                {block.type === 'grid' && (
                  <div className="space-y-4">
                    {/* Grid Configuration Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest/90 border border-surface-container-high/40 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-on-surface">Layout Columns:</span>
                        <div className="flex items-center space-x-1 bg-surface-container-low p-1 rounded border border-surface-container-high/40">
                          {([2, 3, 4] as const).map((colCount) => (
                            <button
                              key={colCount}
                              type="button"
                              onClick={() => updateBlock(block.id, { columns: colCount })}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                                (block.columns || 3) === colCount
                                  ? 'bg-primary text-on-primary shadow-sm'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              {colCount} Cols
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-on-surface-variant font-mono">
                          {block.items?.length || 0} Card{block.items?.length === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentItems = block.items || [];
                            const newItem = {
                              id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                              icon: '📌',
                              badge: '',
                              title: `Card ${currentItems.length + 1}`,
                              text: 'Write card description or information here...',
                              buttonText: '',
                              buttonUrl: ''
                            };
                            updateBlock(block.id, { items: [...currentItems, newItem] });
                          }}
                          className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-highest text-primary hover:text-primary rounded text-xs font-medium flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Card</span>
                        </button>
                      </div>
                    </div>

                    {/* Cards List */}
                    <div className="space-y-3">
                      {(block.items || []).map((item, itemIdx) => (
                        <div
                          key={item.id || itemIdx}
                          className="bg-surface-container-lowest border border-surface-container-high/40 rounded-lg p-3.5 space-y-2.5 relative group/card hover:border-surface-container-high/50 transition"
                        >
                          <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-2">
                            <span className="text-xs font-semibold text-on-surface-variant flex items-center space-x-1.5">
                              <span className="w-4 h-4 rounded-full bg-surface-container text-[10px] flex items-center justify-center text-primary font-mono font-bold">
                                {itemIdx + 1}
                              </span>
                              <span>Column Item</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const currentItems = block.items || [];
                                updateBlock(block.id, {
                                  items: currentItems.filter((_, idx) => idx !== itemIdx)
                                });
                              }}
                              className="text-on-surface-variant hover:text-red-400 p-1 rounded transition"
                              title="Delete Card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Icon / Emoji</label>
                              <input
                                type="text"
                                value={item.icon || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], icon: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                placeholder="✨ or 💡"
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded px-2.5 py-1.5 text-xs text-on-surface"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Badge (Optional)</label>
                              <input
                                type="text"
                                value={item.badge || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], badge: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                placeholder="Popular, New, etc."
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded px-2.5 py-1.5 text-xs text-primary"
                              />
                            </div>
                            <div className="sm:col-span-7">
                              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Title</label>
                              <input
                                type="text"
                                value={item.title || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], title: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                placeholder="Card headline or title"
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded px-2.5 py-1.5 text-xs font-semibold text-on-surface"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Content Text</label>
                            <textarea
                              rows={2}
                              value={item.text || ''}
                              onChange={(e) => {
                                const newItems = [...(block.items || [])];
                                newItems[itemIdx] = { ...newItems[itemIdx], text: e.target.value };
                                updateBlock(block.id, { items: newItems });
                              }}
                              placeholder="Description or key points for this card..."
                              className="w-full bg-surface-container-low border border-surface-container-high/40 rounded p-2 text-xs text-on-surface"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Button Label (Optional)</label>
                              <input
                                type="text"
                                value={item.buttonText || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], buttonText: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                placeholder="Learn More, View Details..."
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded px-2.5 py-1.5 text-xs text-on-surface"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Button Link / URL (Optional)</label>
                              <input
                                type="text"
                                value={item.buttonUrl || ''}
                                onChange={(e) => {
                                  const newItems = [...(block.items || [])];
                                  newItems[itemIdx] = { ...newItems[itemIdx], buttonUrl: e.target.value };
                                  updateBlock(block.id, { items: newItems });
                                }}
                                placeholder="/contact or https://..."
                                className="w-full bg-surface-container-low border border-surface-container-high/40 rounded px-2.5 py-1.5 text-xs font-mono text-on-surface"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const currentItems = block.items || [];
                        const newItem = {
                          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          icon: '⚡',
                          badge: '',
                          title: `Card ${currentItems.length + 1}`,
                          text: 'Write card description or information here...',
                          buttonText: '',
                          buttonUrl: ''
                        };
                        updateBlock(block.id, { items: [...currentItems, newItem] });
                      }}
                      className="w-full py-2 border border-dashed border-surface-container-high/40 hover:border-surface-container-high/50 bg-surface-container-lowest/50 hover:bg-surface-container-lowest text-xs text-primary rounded-lg flex items-center justify-center space-x-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Grid Card</span>
                    </button>
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="py-2 text-center text-xs text-outline-variant font-mono">
                    ────────── Horizontal Rule Divider ──────────
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Media picker for images */}
      <MediaPickerModal
        isOpen={Boolean(mediaPickerBlockId)}
        onClose={() => setMediaPickerBlockId(null)}
        onSelect={(url, alt) => {
          if (mediaPickerBlockId) {
            updateBlock(mediaPickerBlockId, { url, alt: alt || '' });
          }
        }}
      />
    </div>
  );
};
