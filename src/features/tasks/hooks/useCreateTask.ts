import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../../api";
import { createTask } from "../api/tasksApi";

type TasksQueryFilters = {
  projectId?: number;
  status?: Task["status"];
  priority?: Task["priority"];
};

function getTaskFiltersFromQueryKey(queryKey: readonly unknown[]) {
  const filters = queryKey[1];
  return filters && typeof filters === "object" ? (filters as TasksQueryFilters) : {};
}

function taskMatchesFilters(task: Task, filters: TasksQueryFilters) {
  return (
    (filters.projectId === undefined || task.projectId === filters.projectId) &&
    (filters.status === undefined || task.status === filters.status) &&
    (filters.priority === undefined || task.priority === filters.priority)
  );
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: async (task, variables) => {
      const taskForCache = {
        ...task,
        projectId: task.projectId ?? variables.projectId,
      };

      queryClient.setQueryData<Task>(["task", taskForCache.id], taskForCache);
      queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }).forEach(([queryKey, tasks]) => {
        if (!tasks) {
          return;
        }

        const filters = getTaskFiltersFromQueryKey(queryKey);
        if (!taskMatchesFilters(taskForCache, filters)) {
          return;
        }

        queryClient.setQueryData<Task[]>(
          queryKey,
          tasks.some((item) => item.id === taskForCache.id) ? tasks : [taskForCache, ...tasks],
        );
      });

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
