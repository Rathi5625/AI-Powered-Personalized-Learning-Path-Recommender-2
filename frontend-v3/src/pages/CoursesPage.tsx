import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Video,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCourses, useCourseSearch } from '@/hooks/api/useCourses';
import type { CourseLevel, ResourceType } from '@/types';
import {
  Card,
  Button,
  Eyebrow,
  LoadingSpinner,
  ErrorState,
  LevelBadge,
  ResourceTypeBadge,
  EmptyState,
} from '@/components/common';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentType = (searchParams.get('resourceType') as ResourceType) || undefined;
  const currentLevel = (searchParams.get('level') as CourseLevel) || undefined;
  const currentPage = parseInt(searchParams.get('page') || '0', 10);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Semantic search hook
  const { data: searchResults, isLoading: isSearchLoading } = useCourseSearch(
    activeSearch,
    18
  );

  // Standard paginated catalog
  const {
    data: catalogData,
    isLoading: isCatalogLoading,
    isError,
    refetch,
  } = useCourses({
    resourceType: currentType,
    level: currentLevel,
    page: currentPage,
    size: 12,
  });

  const handleTypeTab = (type?: ResourceType) => {
    const next = new URLSearchParams(searchParams);
    if (type) next.set('resourceType', type);
    else next.delete('resourceType');
    next.set('page', '0');
    setSearchParams(next);
  };

  const handleLevelFilter = (level?: CourseLevel) => {
    const next = new URLSearchParams(searchParams);
    if (level) next.set('level', level);
    else next.delete('level');
    next.set('page', '0');
    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const isSearching = activeSearch.length > 0;
  const courses = isSearching ? searchResults || [] : catalogData?.content || [];
  const isLoading = isSearching ? isSearchLoading : isCatalogLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <Eyebrow tone="ion">KNOWLEDGE REPOSITORY</Eyebrow>
          <h1 className="font-display text-3xl text-text mt-1">Curriculum Catalog</h1>
          <p className="text-sm text-muted">
            Explore 792 curated courses, modules, and YouTube lectures
          </p>
        </div>

        {/* Semantic Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search concepts, tools, skills..."
            className="w-full rounded-full border border-line bg-surface-2 py-2 pl-9 pr-4 text-xs text-text placeholder:text-muted focus:border-ion focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          {activeSearch && (
            <button
              type="button"
              onClick={() => {
                setActiveSearch('');
                setSearchInput('');
              }}
              className="absolute right-3 top-2.5 text-xs text-muted hover:text-text"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Resource Type & Level Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Resource Type Tabs */}
        <div className="flex rounded-lg border border-line bg-surface-2 p-1 text-xs">
          <button
            onClick={() => handleTypeTab(undefined)}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              !currentType ? 'bg-ion/20 text-ion' : 'text-muted hover:text-text'
            }`}
          >
            All Resources
          </button>
          <button
            onClick={() => handleTypeTab('COURSE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              currentType === 'COURSE' ? 'bg-ion/20 text-ion' : 'text-muted hover:text-text'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Courses
          </button>
          <button
            onClick={() => handleTypeTab('VIDEO')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              currentType === 'VIDEO' ? 'bg-ember/20 text-ember' : 'text-muted hover:text-text'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            YouTube Videos
          </button>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-muted mr-1 hidden sm:inline">Level:</span>
          {(['BEGINNER', 'EASY', 'MEDIUM', 'HIGH'] as CourseLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleLevelFilter(currentLevel === lvl ? undefined : lvl)}
              className={`px-2.5 py-1 rounded border font-mono text-[11px] transition-colors ${
                currentLevel === lvl
                  ? 'border-ion bg-ion/15 text-ion'
                  : 'border-line bg-surface-2 text-muted hover:text-text'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner label="Loading Curriculum Data..." />
        </div>
      ) : isError ? (
        <ErrorState
          title="Catalog Unavailable"
          message="Could not load courses from the backend."
          onRetry={() => refetch()}
        />
      ) : courses.length === 0 ? (
        <EmptyState
          title="No Learning Resources Found"
          description="Try adjusting your search terms or filter selections."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="flex flex-col justify-between border-line bg-surface/90 p-5 hover:border-ion/50 transition-all cursor-pointer shadow-panel group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <LevelBadge level={course.level} />
                  <ResourceTypeBadge type={course.resourceType} />
                </div>

                <h3 className="text-base font-semibold text-text group-hover:text-ion transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                  {course.description || 'Comprehensive learning module for technical mastery.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-line/60">
                {/* Skill tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {course.skillTags?.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {s.name}
                    </span>
                  ))}
                  {course.skillTags && course.skillTags.length > 3 && (
                    <span className="font-mono text-[10px] text-muted">
                      +{course.skillTags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{course.platform || 'Online Resource'}</span>
                  {course.durationHours && <span>{course.durationHours} hrs</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination (when not searching) */}
      {!isSearching && catalogData && catalogData.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-line pt-6">
          <span className="font-mono text-xs text-muted">
            Page {catalogData.number + 1} of {catalogData.totalPages} ({catalogData.totalElements} Total)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={catalogData.first}
              onClick={() => handlePageChange(catalogData.number - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={catalogData.last}
              onClick={() => handlePageChange(catalogData.number + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
