import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FolderKanban, Users,
  Calendar, ArrowRight, Crown,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import type { Project } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/projects/');
      setProjects(res.data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  return (
    <>
      <Navbar
        title="Projects"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New project
          </Button>
        }
      />

      <div className="p-6">
        {loading ? (
          <PageSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchProjects} />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FolderKanban size={48} className="text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium mb-1">No projects yet</p>
            <p className="text-slate-500 text-sm mb-4">Create your first project to get started</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => {
              const isOwner = project.ownerId === user?.id;
              const memberCount = project.memberships?.length ?? 0;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="card p-5 hover:border-primary-500/50 hover:bg-slate-800/80
                             cursor-pointer transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/20 border border-primary-500/20
                                    flex items-center justify-center">
                      <FolderKanban size={20} className="text-primary-400" />
                    </div>
                    {isOwner && (
                      <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10
                                       px-2 py-0.5 rounded-full border border-yellow-400/20">
                        <Crown size={10} /> Owner
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-100 mb-1 group-hover:text-primary-300 transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users size={12} />
                      <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={12} />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-slate-600 group-hover:text-primary-400 transition-colors"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(p) => setProjects((prev) => [p, ...prev])}
      />
    </>
  );
}