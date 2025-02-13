<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\UX\Map\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\UX\Map\Icon\Icon;
use Symfony\UX\Map\Icon\InlineSvg;
use Symfony\UX\Map\Icon\Url;
use Symfony\UX\Map\Icon\UxIcon;

class IconTest extends TestCase
{
    public function testIconConstruction(): void
    {
        self::assertInstanceOf(Url::class, Icon::fromUrl(url: 'https://image.png'));
        self::assertInstanceOf(InlineSvg::class, Icon::fromInlineSVG(html: '<svg></svg>'));
        self::assertInstanceOf(UxIcon::class, Icon::fromUxIcon(name: 'bi:heart'));
    }

    public function testToArray(): void
    {
        $urlIcon = Icon::fromUrl(url: 'https://image.png');
        $array = $urlIcon->toArray();

        self::assertSame([
            'content' => 'https://image.png',
            'type' => 'url',
            'width' => 24,
            'height' => 24,
        ], $array);
    }

    public function testFromArray(): void
    {
        $urlIcon = Icon::fromUrl(url: 'https://image.png');
        $array = $urlIcon->toArray();

        self::assertEquals(
            $urlIcon, Icon::fromArray($array));
    }
}
