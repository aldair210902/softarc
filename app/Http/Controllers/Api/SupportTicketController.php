<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\Audit;
use App\Support\Notify;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index()
    {
        return SupportTicketResource::collection(
            SupportTicket::query()
                ->with(['client', 'assignee'])
                ->latest('last_activity_at')
                ->latest()
                ->get()
        );
    }

    public function assignees()
    {
        return response()->json(
            User::query()
                ->where('status', 'Activo')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $u) => [
                    'id' => (string) $u->id,
                    'name' => $u->name,
                ])
                ->values()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'clientId' => ['nullable', 'exists:clients,id'],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'internalNotes' => ['nullable', 'string'],
            'client' => ['nullable', 'string', 'max:255'],
            'system' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
            'assigneeId' => ['nullable', 'exists:users,id'],
        ]);

        $ticket = SupportTicket::query()->create([
            'client_id' => $data['clientId'] ?? null,
            'subject' => $data['subject'],
            'description' => $data['description'] ?? null,
            'internal_notes' => $data['internalNotes'] ?? null,
            'client_name' => $data['client'] ?? null,
            'system' => $data['system'] ?? null,
            'priority' => $data['priority'] ?? 'Media',
            'status' => $data['status'] ?? 'Pendiente',
            'assignee_id' => $data['assigneeId'] ?? null,
            'last_activity_at' => now(),
        ]);

        Audit::log('Ticket creado', 'Soporte', ['id' => $ticket->id, 'subject' => $ticket->subject]);

        Notify::toPermission(
            ['tickets.manage', 'tickets.view'],
            'ticket',
            'Nuevo ticket: '.$ticket->subject,
            ($ticket->client_name ?: 'Interno').' · Prioridad '.$ticket->priority,
            '/admin/support',
            ['ticketId' => $ticket->id],
            auth()->id()
        );

        if ($ticket->assignee_id && (int) $ticket->assignee_id !== (int) auth()->id()) {
            Notify::toUser(
                (int) $ticket->assignee_id,
                'ticket',
                'Ticket asignado: '.$ticket->subject,
                'Te asignaron este ticket.',
                '/admin/support',
                ['ticketId' => $ticket->id]
            );
        }

        return (new SupportTicketResource($ticket->load(['client', 'assignee'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, SupportTicket $ticket)
    {
        $data = $request->validate([
            'clientId' => ['nullable', 'exists:clients,id'],
            'subject' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'internalNotes' => ['nullable', 'string'],
            'client' => ['nullable', 'string', 'max:255'],
            'system' => ['nullable', 'string', 'max:255'],
            'priority' => ['sometimes', 'string', 'max:50'],
            'status' => ['sometimes', 'string', 'max:50'],
            'assigneeId' => ['nullable', 'exists:users,id'],
        ]);

        $previousAssignee = $ticket->assignee_id;

        $ticket->update([
            'client_id' => array_key_exists('clientId', $data) ? $data['clientId'] : $ticket->client_id,
            'subject' => $data['subject'] ?? $ticket->subject,
            'description' => array_key_exists('description', $data) ? $data['description'] : $ticket->description,
            'internal_notes' => array_key_exists('internalNotes', $data) ? $data['internalNotes'] : $ticket->internal_notes,
            'client_name' => array_key_exists('client', $data) ? $data['client'] : $ticket->client_name,
            'system' => array_key_exists('system', $data) ? $data['system'] : $ticket->system,
            'priority' => $data['priority'] ?? $ticket->priority,
            'status' => $data['status'] ?? $ticket->status,
            'assignee_id' => array_key_exists('assigneeId', $data) ? $data['assigneeId'] : $ticket->assignee_id,
            'last_activity_at' => now(),
        ]);

        Audit::log('Ticket actualizado', 'Soporte', ['id' => $ticket->id, 'status' => $ticket->status]);

        if (
            array_key_exists('assigneeId', $data)
            && $ticket->assignee_id
            && (int) $ticket->assignee_id !== (int) $previousAssignee
            && (int) $ticket->assignee_id !== (int) auth()->id()
        ) {
            Notify::toUser(
                (int) $ticket->assignee_id,
                'ticket',
                'Ticket asignado: '.$ticket->subject,
                'Te asignaron este ticket ('.$ticket->status.').',
                '/admin/support',
                ['ticketId' => $ticket->id]
            );
        }

        return new SupportTicketResource($ticket->load(['client', 'assignee']));
    }

    public function claim(Request $request, SupportTicket $ticket)
    {
        $user = $request->user();

        $ticket->update([
            'assignee_id' => $user->id,
            'status' => $ticket->status === 'Pendiente' ? 'En Proceso' : $ticket->status,
            'last_activity_at' => now(),
        ]);

        Audit::log('Ticket tomado', 'Soporte', ['id' => $ticket->id, 'assignee' => $user->id]);

        return new SupportTicketResource($ticket->load(['client', 'assignee']));
    }

    public function destroy(SupportTicket $ticket)
    {
        $ticket->delete();
        Audit::log('Ticket eliminado', 'Soporte', ['id' => $ticket->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
