<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class TrustProxiesTest extends TestCase
{
    public function test_https_from_the_hosting_proxy_is_trusted(): void
    {
        Route::get('/_scheme', fn (Request $request) => $request->getScheme());

        $this->withHeaders(['X-Forwarded-Proto' => 'https'])
            ->get('/_scheme')
            ->assertSeeText('https');
    }
}
