<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_home_page_leads_guests_to_the_login_page(): void
    {
        $this->get(route('home'))->assertRedirect(route('dashboard'));

        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_the_home_page_leads_signed_in_users_to_the_plan(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertRedirect(route('dashboard'));
    }
}
