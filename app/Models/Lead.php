<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'contact_name',
        'company_name',
        'phone',
        'email',
        'service_of_interest',
        'status',
        'notes',
        'converted_client_id',
    ];
}
