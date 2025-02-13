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
 */
class Icon
{
    public const TYPE_URL = 'url';
    public const TYPE_INLINE_SVG = 'inline-svg';
    public const TYPE_UX_ICON = 'ux-icon';

    private function __construct(
        public string $content,
        public string $type,
        public int $width = 24,
        public int $height = 24,
    ) {
    }

    public function toArray(): array
    {
        return [
            'content' => $this->content,
            'type' => $this->type,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }

    public static function fromUrl(string $url, int $width = 24, int $height = 24): Url
    {
        return new Url(
            content: $url,
            type: self::TYPE_URL,
            width: $width,
            height: $height
        );
    }

    public static function fromInlineSVG(string $html, int $width = 24, int $height = 24): InlineSvg
    {
        return new InlineSvg(
            content: $html,
            type: self::TYPE_INLINE_SVG,
            width: $width,
            height: $height
        );
    }

    public static function fromUxIcon(string $name, int $width = 24, int $height = 24): UxIcon
    {
        return new UxIcon(
            content: $name,
            type: self::TYPE_UX_ICON,
            width: $width,
            height: $height
        );
    }

    /**
     * @param array{
     *     content: string,
     *     type: string,
     *     width: int,
     *     height: int,
     * } $data
     *
     * @internal
     */
    public static function fromArray(array $data): static
    {
        return match ($data['type']) {
            'url' => self::fromUrl($data['content'], (int) $data['width'], (int) $data['height']),
            'inline-svg' => self::fromInlineSvg($data['content'], (int) $data['width'], (int) $data['height']),
            'ux-icon' => self::fromUxIcon($data['content'], (int) $data['width'], (int) $data['height']),
            default => throw new InvalidArgumentException(\sprintf('Invalid icon type %s.', $data['type'])),
        };
    }
}
