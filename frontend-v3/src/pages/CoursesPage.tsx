import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, BookOpen, Video, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
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

  const { data: searchResults, isLoading: isSearchLoading } = useCourseSearch(activeSearch, 18);
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
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex flex-col gap-6 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>Knowledge repository</Eyebrow>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.055em] text-text sm:text-5xl">Curriculum Catalog</h1>
          <p className="mt-2 text-sm text-muted">
            Explore {catalogData?.totalElements !== undefined ? `${catalogData.totalElements} curated` : 'curated'} courses, modules, and YouTube lectures
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full lg:max-w-sm">
          <label htmlFor="catalog-search" className="sr-only">Search concepts, tools, skills</label>
          <input
            id="catalog-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search concepts, tools, skills..."
            className="h-12 w-full rounded-full border border-line bg-surface py-2 pl-11 pr-16 text-sm text-text shadow-card-soft placeholder:text-muted-2 transition-[border-color,box-shadow] focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/15"
          />
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted" aria-hidden />
          {activeSearch && (
            <button
              type="button"
              onClick={() => {
                setActiveSearch('');
                setSearchInput('');
              }}
              className="absolute right-4 top-3.5 text-xs font-semibold text-ion-deep hover:text-ion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-line bg-accent-tint/65 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex w-full overflow-x-auto rounded-full border border-line/80 bg-surface/80 p-1 text-xs sm:w-auto">
          <button
            onClick={() => handleTypeTab(undefined)}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-colors ${!currentType ? 'bg-dark text-white shadow-card-soft' : 'text-muted hover:text-text'}`}
          >
            All Resources
          </button>
          <button
            onClick={() => handleTypeTab('COURSE')}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-full px-4 py-2 font-semibold transition-colors ${currentType === 'COURSE' ? 'bg-ion text-white shadow-glow-ion' : 'text-muted hover:text-text'}`}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Courses
          </button>
          <button
            onClick={() => handleTypeTab('VIDEO')}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-full px-4 py-2 font-semibold transition-colors ${currentType === 'VIDEO' ? 'bg-ember text-white shadow-glow-ember' : 'text-muted hover:text-text'}`}
          >
            <Video className="h-3.5 w-3.5" aria-hidden />
            YouTube Videos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 hidden font-mono text-hud uppercase text-muted sm:inline">Level:</span>
          {(['BEGINNER', 'EASY', 'MEDIUM', 'HIGH'] as CourseLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => handleLevelFilter(currentLevel === lvl ? undefined : lvl)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold transition-colors ${currentLevel === lvl ? 'border-ion/30 bg-surface text-ion-deep shadow-card-soft' : 'border-line/80 bg-surface/60 text-muted hover:border-ion/40 hover:text-text'}`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-card border border-line bg-surface">
          <LoadingSpinner label="Loading Curriculum Data..." />
        </div>
      ) : isError ? (
        <ErrorState title="Catalog Unavailable" message="Could not load courses from the backend." onRetry={() => refetch()} />
      ) : courses.length === 0 ? (
        <EmptyState title="No Learning Resources Found" description="Try adjusting your search terms or filter selections." />
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-mono text-hud uppercase text-muted">{isSearching ? 'Search results' : 'Showing curated resources'}</p>
            {!isSearching && catalogData && <p className="text-xs text-muted-2">12 per page</p>}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="group flex min-h-[280px] cursor-pointer flex-col justify-between p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:border-ion/45 hover:shadow-panel"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between gap-2">
                    <LevelBadge level={course.level} />
                    <ResourceTypeBadge type={course.resourceType} />
                  </div>
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight tracking-[-0.035em] text-text transition-colors group-hover:text-ion-deep">
                    {course.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                    {course.description || 'Comprehensive learning module for technical mastery.'}
                  </p>
                </div>

                <div className="mt-6 border-t border-line/80 pt-4">
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {course.skillTags?.slice(0, 3).map((s) => (
                      <span key={s.id} className="rounded-full bg-surface-alt px-2.5 py-1 text-[10px] text-muted">{s.name}</span>
                    ))}
                    {course.skillTags && course.skillTags.length > 3 && (
                      <span className="rounded-full bg-surface-alt px-2.5 py-1 font-mono text-[10px] text-muted">+{course.skillTags.length - 3}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{course.platform || 'Online Resource'}</span>
                    <span className="flex items-center gap-2">
                      {course.durationHours && `${course.durationHours} hrs`}
                      <ArrowUpRight className="h-3.5 w-3.5 text-ion opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!isSearching && catalogData && catalogData.totalPages > 1 && (
        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono text-xs text-muted">Page {catalogData.number + 1} of {catalogData.totalPages} ({catalogData.totalElements} Total)</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={catalogData.first} onClick={() => handlePageChange(catalogData.number - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={catalogData.last} onClick={() => handlePageChange(catalogData.number + 1)}>
              Next <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
