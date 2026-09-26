<?php

namespace App\Models\Concerns;

use Carbon\CarbonInterface;

/**
 * For items with an expiry setting (expiry_type lifetime|limited_time and expiry_months): when access
 * would end for someone enrolling now.
 */
trait HasAccessPeriod
{
    /**
     * Null for lifetime access.
     */
    public function accessEndsAt(): ?CarbonInterface
    {
        return $this->expiry_type === 'limited_time' && $this->expiry_months
            ? now()->addMonths($this->expiry_months)
            : null;
    }
}
