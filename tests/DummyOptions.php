<?php

declare(strict_types=1);

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\UX\Map\Tests;

use Symfony\UX\Map\MapOptionsInterface;
use Symfony\UX\Map\MapOptionsNormalizer;

final readonly class DummyOptions implements MapOptionsInterface
{
    public function __construct(
        private string $mapId,
        private string $mapType,
    ) {
    }

    public static function registerToNormalizer(): void
    {
        MapOptionsNormalizer::$providers['dummy'] = self::class;
    }

    public static function unregisterFromNormalizer(): void
    {
        unset(MapOptionsNormalizer::$providers['dummy']);
    }

    public static function fromArray(array $array): MapOptionsInterface
    {
        return new self(
            $array['mapId'],
            $array['mapType'],
        );
    }

    public function toArray(): array
    {
        return [
            'mapId' => $this->mapId,
            'mapType' => $this->mapType,
        ];
    }
}
