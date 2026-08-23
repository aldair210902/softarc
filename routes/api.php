<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanySettingsController;
use App\Http\Controllers\Api\CredentialController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DomainController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\HostingPackageController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\ServerController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\WikiController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/catalog', [CatalogController::class, 'index']);
Route::get('/company-settings', [CompanySettingsController::class, 'show']);
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('/dashboard', DashboardController::class)
        ->middleware('permission:dashboard.view');

    Route::get('/profile', [ProfileController::class, 'show'])
        ->middleware('permission:profile.manage');
    Route::put('/profile', [ProfileController::class, 'update'])
        ->middleware('permission:profile.manage');

    Route::put('/company-settings', [CompanySettingsController::class, 'update'])
        ->middleware('permission:settings.manage');

    Route::get('/leads', [LeadController::class, 'index'])->middleware('permission:crm.manage,crm.view');
    Route::put('/leads/{lead}', [LeadController::class, 'update'])->middleware('permission:crm.manage');
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy'])->middleware('permission:crm.manage');

    Route::get('/clients', [ClientController::class, 'index'])->middleware('permission:clients.manage,clients.view');
    Route::get('/clients/{client}/hosting', [ClientController::class, 'hosting'])->middleware('permission:clients.manage,clients.view');
    Route::post('/clients', [ClientController::class, 'store'])->middleware('permission:clients.manage');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->middleware('permission:clients.manage');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->middleware('permission:clients.manage');

    Route::get('/subscriptions', [SubscriptionController::class, 'index'])->middleware('permission:clients.manage,clients.view,finances.view,finances.manage');
    Route::post('/subscriptions', [SubscriptionController::class, 'store'])->middleware('permission:clients.manage,finances.manage');
    Route::put('/subscriptions/{subscription}', [SubscriptionController::class, 'update'])->middleware('permission:clients.manage,finances.manage');
    Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy'])->middleware('permission:clients.manage,finances.manage');

    Route::get('/transactions', [TransactionController::class, 'index'])->middleware('permission:finances.manage,finances.view');
    Route::post('/transactions', [TransactionController::class, 'store'])->middleware('permission:finances.manage');
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update'])->middleware('permission:finances.manage');
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy'])->middleware('permission:finances.manage');

    Route::get('/expenses', [ExpenseController::class, 'index'])->middleware('permission:finances.manage,finances.view');
    Route::post('/expenses', [ExpenseController::class, 'store'])->middleware('permission:finances.manage');
    Route::put('/expenses/{expense}', [ExpenseController::class, 'update'])->middleware('permission:finances.manage');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->middleware('permission:finances.manage');

    Route::post('/catalog', [CatalogController::class, 'store'])->middleware('permission:catalog.manage');
    Route::put('/catalog/{catalog}', [CatalogController::class, 'update'])->middleware('permission:catalog.manage');
    Route::delete('/catalog/{catalog}', [CatalogController::class, 'destroy'])->middleware('permission:catalog.manage');

    Route::get('/media', [MediaController::class, 'index'])->middleware('permission:catalog.manage,catalog.view,settings.manage');
    Route::post('/media/upload', [MediaController::class, 'upload'])->middleware('permission:catalog.manage,settings.manage');
    Route::delete('/media', [MediaController::class, 'destroy'])->middleware('permission:catalog.manage,settings.manage');

    Route::get('/projects', [ProjectController::class, 'index'])->middleware('permission:projects.manage,projects.view');
    Route::post('/projects', [ProjectController::class, 'store'])->middleware('permission:projects.manage');
    Route::put('/projects/{project}', [ProjectController::class, 'update'])->middleware('permission:projects.manage');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->middleware('permission:projects.manage');

    Route::get('/tickets', [SupportTicketController::class, 'index'])->middleware('permission:tickets.manage,tickets.view');
    Route::get('/tickets/assignees', [SupportTicketController::class, 'assignees'])->middleware('permission:tickets.manage');
    Route::post('/tickets', [SupportTicketController::class, 'store'])->middleware('permission:tickets.manage');
    Route::put('/tickets/{ticket}', [SupportTicketController::class, 'update'])->middleware('permission:tickets.manage');
    Route::post('/tickets/{ticket}/claim', [SupportTicketController::class, 'claim'])->middleware('permission:tickets.manage');
    Route::delete('/tickets/{ticket}', [SupportTicketController::class, 'destroy'])->middleware('permission:tickets.manage');

    Route::get('/notifications', [NotificationController::class, 'index'])->middleware('permission:dashboard.view,profile.manage');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->middleware('permission:dashboard.view,profile.manage');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->middleware('permission:dashboard.view,profile.manage');

    Route::get('/servers', [ServerController::class, 'index'])->middleware('permission:servers.manage,servers.view');
    Route::post('/servers', [ServerController::class, 'store'])->middleware('permission:servers.manage');
    Route::put('/servers/{server}', [ServerController::class, 'update'])->middleware('permission:servers.manage');
    Route::delete('/servers/{server}', [ServerController::class, 'destroy'])->middleware('permission:servers.manage');

    Route::get('/domains', [DomainController::class, 'index'])->middleware('permission:domains.manage,domains.view');
    Route::post('/domains', [DomainController::class, 'store'])->middleware('permission:domains.manage');
    Route::put('/domains/{domain}', [DomainController::class, 'update'])->middleware('permission:domains.manage');
    Route::delete('/domains/{domain}', [DomainController::class, 'destroy'])->middleware('permission:domains.manage');

    Route::get('/providers', [ProviderController::class, 'index'])
        ->middleware('permission:servers.manage,servers.view,domains.manage,domains.view,finances.manage,finances.view');
    Route::post('/providers', [ProviderController::class, 'store'])
        ->middleware('permission:servers.manage,domains.manage');
    Route::put('/providers/{provider}', [ProviderController::class, 'update'])
        ->middleware('permission:servers.manage,domains.manage');
    Route::delete('/providers/{provider}', [ProviderController::class, 'destroy'])
        ->middleware('permission:servers.manage,domains.manage');

    Route::post('/hosting-packages', [HostingPackageController::class, 'store'])
        ->middleware('permission:servers.manage,domains.manage,credentials.manage');

    Route::get('/credentials', [CredentialController::class, 'index'])->middleware('permission:credentials.manage,credentials.view,credentials.reveal');
    Route::post('/credentials', [CredentialController::class, 'store'])->middleware('permission:credentials.manage');
    Route::put('/credentials/{credential}', [CredentialController::class, 'update'])->middleware('permission:credentials.manage');
    Route::delete('/credentials/{credential}', [CredentialController::class, 'destroy'])->middleware('permission:credentials.manage');
    Route::get('/credentials/{credential}/reveal', [CredentialController::class, 'reveal'])
        ->middleware('permission:credentials.reveal,credentials.manage');

    Route::get('/team', [TeamController::class, 'index'])->middleware('permission:team.manage');
    Route::post('/team', [TeamController::class, 'store'])->middleware('permission:team.manage');
    Route::put('/team/{team}', [TeamController::class, 'update'])->middleware('permission:team.manage');
    Route::delete('/team/{team}', [TeamController::class, 'destroy'])->middleware('permission:team.manage');

    Route::get('/wiki/categories', [WikiController::class, 'categories'])->middleware('permission:wiki.manage,wiki.view');
    Route::post('/wiki/categories', [WikiController::class, 'storeCategory'])->middleware('permission:wiki.manage');
    Route::get('/wiki/articles/{article}', [WikiController::class, 'showArticle'])->middleware('permission:wiki.manage,wiki.view');
    Route::post('/wiki/articles', [WikiController::class, 'storeArticle'])->middleware('permission:wiki.manage');
    Route::put('/wiki/articles/{article}', [WikiController::class, 'updateArticle'])->middleware('permission:wiki.manage');
    Route::delete('/wiki/articles/{article}', [WikiController::class, 'destroyArticle'])->middleware('permission:wiki.manage');

    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit.view');
    Route::put('/audit-logs/settings', [AuditLogController::class, 'updateSettings'])->middleware('permission:settings.manage');
    Route::post('/audit-logs/prune', [AuditLogController::class, 'prune'])->middleware('permission:settings.manage');
});
