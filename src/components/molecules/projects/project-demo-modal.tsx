"use client";

import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { ProjectMetadataService } from "@/lib/projects/project-metadata";

interface ProjectDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectService: ProjectMetadataService;
}

/**
 * ProjectDemoModal component
 * @param {ProjectDemoModalProps} props - The props for the ProjectDemoModal component
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {string} props.projectId - The id of the project
 * @param {ProjectMetadataService} props.projectService - The project metadata service
 * @returns {JSX.Element} The ProjectDemoModal component
 */
export function ProjectDemoModal({
  isOpen,
  onClose,
  projectId,
  projectService,
}: ProjectDemoModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const project = projectService.getProjectById(projectId);
  const projectUrl = project?.demoUrl || "";
  const projectTitle = project?.name || "Unknown Project";
  const projectDescription = project?.description;

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
    }
  }, [isOpen, projectUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(
      "Failed to load project demo. Please check the URL or try again later.",
    );
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("");
      const iframe = iframeRef.current;
      if (iframe) {
        const currentSrc = iframe.src;
        iframe.src = "";
        setTimeout(() => {
          iframe.src = currentSrc;
        }, 0);
      }
    }
  };

  const handleOpenExternal = () => {
    window.open(projectUrl, "_blank", "noopener,noreferrer");
  };
  if (!isOpen) return null;

  if (!project) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Project Not Found
            </h3>
            <p className="text-gray-400 mb-4">
              The requested project could not be found.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!projectUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Demo Not Available
            </h3>
            <p className="text-gray-400 mb-4">
              This project doesn't have a demo URL available.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[80vh] mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl">
        { }
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">{projectTitle}</h2>
            {projectDescription && (
              <p className="text-sm text-gray-400 mt-1">{projectDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
              title="Refresh demo"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleOpenExternal}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Close demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        { }
        <div className="relative flex-1 h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Loading project demo...</p>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
              <div className="text-center max-w-md mx-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Demo Unavailable
                </h3>
                <p className="text-gray-400 mb-4">{errorMessage}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleOpenExternal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    Open External
                  </button>
                </div>
              </div>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={projectUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`${projectTitle} Demo`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
}

export default ProjectDemoModal;
