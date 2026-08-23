<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Support\Audit;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return ProjectResource::collection(Project::query()->with('client')->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $project = Project::query()->create([
            'client_id' => $data['clientId'],
            'name' => $data['name'],
            'progress' => $data['progress'] ?? 0,
            'status' => $data['status'] ?? 'Planificación',
            'total_amount' => $data['totalAmount'] ?? 0,
            'amount_paid' => $data['amountPaid'] ?? 0,
            'due_date' => $data['dueDate'] ?? null,
            'repo_url' => $data['repoUrl'] ?? null,
            'local_path_pc' => $data['localPathPc'] ?? null,
            'local_path_laptop' => $data['localPathLaptop'] ?? null,
            'last_sync_device' => $data['lastSyncDevice'] ?? null,
            'last_sync_at' => $data['lastSyncAt'] ?? null,
            'sync_note' => $data['syncNote'] ?? null,
            'db_note' => $data['dbNote'] ?? null,
            'last_db_touch_at' => $data['lastDbTouchAt'] ?? null,
            'milestones_total' => $data['milestonesTotal'] ?? 0,
            'milestones_done' => $data['milestonesDone'] ?? 0,
        ]);

        Audit::log('Proyecto creado', 'Proyectos', ['id' => $project->id, 'name' => $project->name]);

        return (new ProjectResource($project->load('client')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Project $project)
    {
        $data = $this->validated($request, true);

        $project->update([
            'client_id' => $data['clientId'] ?? $project->client_id,
            'name' => $data['name'] ?? $project->name,
            'progress' => $data['progress'] ?? $project->progress,
            'status' => $data['status'] ?? $project->status,
            'total_amount' => $data['totalAmount'] ?? $project->total_amount,
            'amount_paid' => $data['amountPaid'] ?? $project->amount_paid,
            'due_date' => array_key_exists('dueDate', $data) ? $data['dueDate'] : $project->due_date,
            'repo_url' => array_key_exists('repoUrl', $data) ? $data['repoUrl'] : $project->repo_url,
            'local_path_pc' => array_key_exists('localPathPc', $data) ? $data['localPathPc'] : $project->local_path_pc,
            'local_path_laptop' => array_key_exists('localPathLaptop', $data) ? $data['localPathLaptop'] : $project->local_path_laptop,
            'last_sync_device' => array_key_exists('lastSyncDevice', $data) ? $data['lastSyncDevice'] : $project->last_sync_device,
            'last_sync_at' => array_key_exists('lastSyncAt', $data) ? $data['lastSyncAt'] : $project->last_sync_at,
            'sync_note' => array_key_exists('syncNote', $data) ? $data['syncNote'] : $project->sync_note,
            'db_note' => array_key_exists('dbNote', $data) ? $data['dbNote'] : $project->db_note,
            'last_db_touch_at' => array_key_exists('lastDbTouchAt', $data) ? $data['lastDbTouchAt'] : $project->last_db_touch_at,
            'milestones_total' => $data['milestonesTotal'] ?? $project->milestones_total,
            'milestones_done' => $data['milestonesDone'] ?? $project->milestones_done,
        ]);

        Audit::log('Proyecto actualizado', 'Proyectos', ['id' => $project->id]);

        return new ProjectResource($project->load('client'));
    }

    public function destroy(Project $project)
    {
        $project->delete();
        Audit::log('Proyecto eliminado', 'Proyectos', ['id' => $project->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'clientId' => [$required, 'exists:clients,id'],
            'name' => [$required, 'string', 'max:255'],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => [$partial ? 'sometimes' : 'nullable', 'string', 'max:50'],
            'totalAmount' => ['nullable', 'numeric', 'min:0'],
            'amountPaid' => ['nullable', 'numeric', 'min:0'],
            'dueDate' => ['nullable', 'date'],
            'repoUrl' => ['nullable', 'string', 'max:500', 'url'],
            'localPathPc' => ['nullable', 'string', 'max:500'],
            'localPathLaptop' => ['nullable', 'string', 'max:500'],
            'lastSyncDevice' => ['nullable', 'string', 'max:50'],
            'lastSyncAt' => ['nullable', 'date'],
            'syncNote' => ['nullable', 'string', 'max:2000'],
            'dbNote' => ['nullable', 'string', 'max:2000'],
            'lastDbTouchAt' => ['nullable', 'date'],
            'milestonesTotal' => ['nullable', 'integer', 'min:0'],
            'milestonesDone' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
