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

use Symfony\UX\Map\Exception\InvalidArgumentException;

/**
 * Represents an icon that can be displayed on a map marker.
 *
 * @author Sylvain Blondeau <contact@sylvainblondeau.dev>
 * @author Hugo Alliaume <hugo@alliau.me>
 */
abstract class Icon
{
    /**
     * @param non-empty-string $url
     */
    public static function url(string $url): UrlIcon
    {
        return new UrlIcon($url);
    }

    /**
     * @param non-empty-string $html
     */
    public static function svg(string $html): SvgIcon
    {
        return new SvgIcon($html);
    }

    /**
     * @param non-empty-string $name
     */
    public static function ux(string $name): UxIcon
    {
        return new UxIcon($name);
    }

    /**
     * @param positive-int $width
     * @param positive-int $height
     */
    protected function __construct(
        protected IconType $type,
        protected int $width = 24,
        protected int $height = 24,
    ) {
    }

    public function width(int $width): static
    {
        if ($width <= 0) {
            throw new InvalidArgumentException('Width must be greater than 0.');
        }

        $this->width = $width;

        return $this;
    }

    public function height(int $height): static
    {
        if ($height <= 0) {
            throw new InvalidArgumentException('Height must be greater than 0.');
        }

        $this->height = $height;

        return $this;
    }

    /**
     * @internal
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type->value,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }

    /**
     * @param array{ type: value-of<IconType>, width: positive-int, height: positive-int }
     *     &(array{ url: non-empty-string }
     *      |array{ html: non-empty-string }
     *      |array{ name: non-empty-string }) $data
     *
     * @internal
     */
    public static function fromArray(array $data): static
    {
        return match ($data['type']) {
            IconType::Url->value => UrlIcon::fromArray($data),
            IconType::Svg->value => SvgIcon::fromArray($data),
            IconType::UxIcon->value => UxIcon::fromArray($data),
            default => throw new InvalidArgumentException(\sprintf('Invalid icon type %s.', $data['type'])),
        };
    }
}
