<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\UX\Map\Icon;

/**
 * Represents an inline SVG icon.
 *
 * @author Sylvain Blondeau <contact@sylvainblondeau.dev>
 * @author Hugo Alliaume <hugo@alliau.me>
 *
 * @internal
 */
class SvgIcon extends Icon
{
    /**
     * @param non-empty-string $html
     * @param positive-int     $width
     * @param positive-int     $height
     */
    protected function __construct(
        protected string $html,
        int $width = 24,
        int $height = 24,
    ) {
        parent::__construct(IconType::Svg, $width, $height);
    }

    /**
     * @param array{ html: string, width: positive-int, height: positive-int } $data
     */
    public static function fromArray(array $data): static
    {
        return new self(
            html: $data['html'],
            width: $data['width'],
            height: $data['height'],
        );
    }

    public function toArray(): array
    {
        return [
            ...parent::toArray(),
            'html' => $this->html,
        ];
    }
}
