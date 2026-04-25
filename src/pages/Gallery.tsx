import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Video,
  Mic,
  Loader2,
  Download,
  Trash2,
  Grid,
  List,
  Filter,
  X,
  ExternalLink
} from 'lucide-react';
import { generationsApi } from '@/utils/api';
import type { Generation } from '@/types';

const typeFilters = [
  { id: 'all', label: 'All', icon: null },
  { id: 'image', label: 'Images', icon: Image },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: Mic },
];

export default function Gallery() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<Generation | null>(null);

  useEffect(() => {
    loadGenerations();
  }, [filter]);

  const loadGenerations = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { type: filter } : undefined;
      const response = await generationsApi.list(params);
      if (response.data.success) {
        setGenerations(response.data.data.generations);
      }
    } catch (error) {
      console.error('Failed to load generations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await generationsApi.delete(id);
      setGenerations(generations.filter((g) => g.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filteredGenerations = generations;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'audio':
        return Mic;
      default:
        return Image;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-pink-500/20 text-pink-400';
      case 'video':
        return 'bg-violet-500/20 text-violet-400';
      case 'audio':
        return 'bg-emerald-500/20 text-emerald-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { class: 'badge-success', text: 'Done' };
      case 'processing':
        return { class: 'badge-info', text: 'Creating...' };
      case 'failed':
        return { class: 'badge-error', text: 'Failed' };
      default:
        return { class: 'badge-warning', text: 'Pending' };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Gallery</h1>
          <p className="text-text-secondary">
            {filteredGenerations.length} creations
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter buttons */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-tertiary">
            {typeFilters.map((f) => {
              const FIcon = f.icon;
              return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  filter === f.id
                    ? 'bg-white/10 text-white'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {FIcon && <FIcon className="w-4 h-4" />}
                <span className="hidden sm:inline">{f.label}</span>
              </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-tertiary">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-text-secondary'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-text-secondary'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredGenerations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No creations yet</h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Start creating amazing content from the Dashboard and your creations will appear here.
          </p>
        </motion.div>
      )}

      {/* Grid view */}
      {!isLoading && viewMode === 'grid' && filteredGenerations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGenerations.map((gen, index) => (
            <motion.div
              key={gen.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-xl overflow-hidden bg-bg-secondary border border-white/5 hover:border-accent-primary/30 transition-all cursor-pointer"
              onClick={() => setSelectedItem(gen)}
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-bg-tertiary flex items-center justify-center">
                {gen.thumbnail_url ? (
                  <img
                    src={gen.thumbnail_url}
                    alt={gen.prompt || 'Generated content'}
                    className="w-full h-full object-cover"
                  />
                ) : gen.type === 'audio' ? (
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    <Mic className="w-12 h-12" />
                    <span className="text-sm">Audio</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    {getTypeIcon(gen.type)({ className: 'w-12 h-12' })}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Type badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(gen.type)}`}>
                  {gen.type}
                </div>

                {/* Status badge */}
                {gen.status !== 'completed' && (
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${getStatusBadge(gen.status).class}`}>
                      {getStatusBadge(gen.status).text}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm truncate">{gen.prompt || 'Untitled'}</p>
                <p className="text-xs text-text-muted mt-1">
                  {new Date(gen.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && viewMode === 'list' && filteredGenerations.length > 0 && (
        <div className="space-y-2">
          {filteredGenerations.map((gen, index) => (
            <motion.div
              key={gen.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-bg-secondary border border-white/5 hover:border-white/10 transition-all"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg bg-bg-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
                {gen.thumbnail_url ? (
                  <img
                    src={gen.thumbnail_url}
                    alt={gen.prompt || 'Generated content'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <getTypeIcon gen.type) className="w-6 h-6 text-text-muted" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{gen.prompt || 'Untitled'}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs ${getTypeColor(gen.type)}`}>{gen.type}</span>
                  <span className="text-xs text-text-muted">
                    {new Date(gen.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status */}
              <span className={`badge ${getStatusBadge(gen.status).class}`}>
                {getStatusBadge(gen.status).text}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {gen.result_url && (
                  <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(gen.id)}
                  className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl bg-bg-secondary border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="flex-1 bg-bg-tertiary flex items-center justify-center min-h-[300px]">
                  {selectedItem.result_url ? (
                    selectedItem.type === 'video' ? (
                      <video
                        src={selectedItem.result_url}
                        controls
                        className="w-full h-auto"
                      />
                    ) : selectedItem.type === 'audio' ? (
                      <div className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                          <Mic className="w-10 h-10 text-accent-primary" />
                        </div>
                        <audio
                          src={selectedItem.result_url}
                          controls
                          className="w-full max-w-md"
                        />
                      </div>
                    ) : (
                      <img
                        src={selectedItem.result_url}
                        alt={selectedItem.prompt || 'Generated content'}
                        className="w-full h-auto"
                      />
                    )
                  ) : (
                    <div className="text-center text-text-muted">
                      <getTypeIcon(selectedItem.type)({ className: 'w-16 h-16 mx-auto mb-4' }) />
                      <p>Generating...</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-white/5">
                  <h3 className="font-semibold mb-4">Details</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-text-muted">Prompt</label>
                      <p className="mt-1">{selectedItem.prompt || 'No prompt'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-muted">Type</label>
                        <p className="mt-1 capitalize">{selectedItem.type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-muted">Status</label>
                        <p className="mt-1">
                          <span className={`badge ${getStatusBadge(selectedItem.status).class}`}>
                            {getStatusBadge(selectedItem.status).text}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-muted">Created</label>
                        <p className="mt-1">
                          {new Date(selectedItem.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-text-muted">Credits</label>
                        <p className="mt-1">{selectedItem.credits_used}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      {selectedItem.result_url && (
                        <a
                          href={selectedItem.result_url}
                          download
                          className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(selectedItem.id)}
                        className="p-3 rounded-xl border border-error/50 text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
