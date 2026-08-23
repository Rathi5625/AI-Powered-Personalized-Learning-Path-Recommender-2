package com.learningpath.dto.response;

import java.util.List;

public class DashboardResponse {

    private long completedCount;
    private long inProgressCount;
    private long totalMilestones;
    private List<String> skillsGained;
    private LearningPathResponse currentPath;
    private MilestoneResponse nextRecommendedMilestone;

    public DashboardResponse() {
    }

    public DashboardResponse(long completedCount, long inProgressCount, long totalMilestones,
                             List<String> skillsGained, LearningPathResponse currentPath,
                             MilestoneResponse nextRecommendedMilestone) {
        this.completedCount = completedCount;
        this.inProgressCount = inProgressCount;
        this.totalMilestones = totalMilestones;
        this.skillsGained = skillsGained;
        this.currentPath = currentPath;
        this.nextRecommendedMilestone = nextRecommendedMilestone;
    }

    public long getCompletedCount() {
        return completedCount;
    }

    public void setCompletedCount(long completedCount) {
        this.completedCount = completedCount;
    }

    public long getInProgressCount() {
        return inProgressCount;
    }

    public void setInProgressCount(long inProgressCount) {
        this.inProgressCount = inProgressCount;
    }

    public long getTotalMilestones() {
        return totalMilestones;
    }

    public void setTotalMilestones(long totalMilestones) {
        this.totalMilestones = totalMilestones;
    }

    public List<String> getSkillsGained() {
        return skillsGained;
    }

    public void setSkillsGained(List<String> skillsGained) {
        this.skillsGained = skillsGained;
    }

    public LearningPathResponse getCurrentPath() {
        return currentPath;
    }

    public void setCurrentPath(LearningPathResponse currentPath) {
        this.currentPath = currentPath;
    }

    public MilestoneResponse getNextRecommendedMilestone() {
        return nextRecommendedMilestone;
    }

    public void setNextRecommendedMilestone(MilestoneResponse nextRecommendedMilestone) {
        this.nextRecommendedMilestone = nextRecommendedMilestone;
    }
}
