import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "../../../api";
import { deleteProject } from "../api/projectsApi";

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["project", projectId] });

      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      const previousProject = queryClient.getQueryData<Project>(["project", projectId]);

      queryClient.setQueryData<Project[] | undefined>(["projects"], (current) =>
        current?.filter((project) => project.id !== projectId),
      );
      queryClient.removeQueries({ queryKey: ["project", projectId] });

      return { previousProjects, previousProject, projectId };
    },
    onError: (_error, _projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }

      if (context?.previousProject) {
        queryClient.setQueryData(["project", context.projectId], context.previousProject);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      ]);
    },
  });
}
