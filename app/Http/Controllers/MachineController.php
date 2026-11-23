<?php

namespace App\Http\Controllers;

use App\Http\Requests\MachineRequest;
use App\Models\Machine;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MachineController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('machines/index', [
            'machines' => Machine::orderBy('id')->get()
                ->map(fn (Machine $machine) => ['id' => $machine->id, 'name' => $machine->name])
                ->all(),
        ]);
    }

    public function store(MachineRequest $request): RedirectResponse
    {
        $machine = Machine::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Machine “{$machine->name}” added."]);

        return back();
    }

    public function update(MachineRequest $request, Machine $machine): RedirectResponse
    {
        $machine->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Machine “{$machine->name}” updated."]);

        return back();
    }

    public function destroy(Machine $machine): RedirectResponse
    {
        if (Machine::count() <= 1) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'The plan needs at least one machine.']);

            return back();
        }

        $machine->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Machine “{$machine->name}” deleted."]);

        return back();
    }
}
