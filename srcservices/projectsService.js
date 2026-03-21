// src/services/projectsService.js
import { apiGet, apiPost } from './apiClient.js';

export async function fetchProjects() {
  return apiGet('projects');
}

export async function fetchProjectById(id) {
  return apiGet(`projects/${id}`);
}

export async function createProject(data) {
  return apiPost('projects', data);
}

export async function updateProject(id, data) {
  return apiPost(`projects/${id}`, data);
}
