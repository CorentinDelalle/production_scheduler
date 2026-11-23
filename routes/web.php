<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\MachineController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductTypeController;
use App\Http\Controllers\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', ScheduleController::class)->name('dashboard');

    $crud = ['index', 'store', 'update', 'destroy'];
    Route::resource('orders', OrderController::class)->only($crud);
    Route::resource('customers', CustomerController::class)->only($crud);
    Route::resource('product-types', ProductTypeController::class)->only($crud);
    Route::resource('products', ProductController::class)->only($crud);
    Route::resource('machines', MachineController::class)->only($crud);
});

require __DIR__.'/settings.php';
