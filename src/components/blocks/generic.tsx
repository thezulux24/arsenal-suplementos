'use client';

import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { CmsField, CmsGallery, CmsImage, CmsLink, CmsList, CmsRichText, CmsText, type CmsBlockProps } from '@latinovation/cms-client/react';
import { Frame } from '../Ornaments';
import { sized } from '../SmartImage';
import { BandHead, Wrap } from './common';

const WideImg = sized('(max-width: 1440px) 100vw, 1400px');
const ThirdImg = sized('(max-width: 760px) 100vw, 33vw');

/** Bloques del catálogo que el cliente puede agregar desde el portal, dibujados en el mundo de azulejos. */

export function RichBlock() {
  return (
    <div className="band">
      <Wrap className="wrap--narrow">
        <CmsRichText f="body" className="prose prose--page" />
      </Wrap>
    </div>
  );
}

export function GalleryTiles() {
  return (
    <div className="band">
      <Wrap>
        <div className="band__head">
          <CmsText f="heading" as="h2" />
        </div>
        <CmsGallery
          f="images"
          className="tiles gallery"
          renderImage={(im, i) => (
            <span className="gallery__cell tile-photo" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url} alt={im.alt} loading="lazy" />
            </span>
          )}
        />
      </Wrap>
    </div>
  );
}

export function StatTiles() {
  return (
    <div className="band">
      <Wrap>
        <div className="band__head">
          <CmsText f="heading" as="h2" />
        </div>
        <CmsList
          f="items"
          className="tiles stats"
          itemClassName="stat"
          renderItem={() => (
            <>
              <CmsText f="value" className="stat__value" />
              <CmsText f="label" className="agate" />
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

/** Testimonios: solo muestra lo que el cliente escriba en el portal; el sitio no trae ninguno inventado. */
export function Quotes() {
  return (
    <div className="band grout-ground">
      <Wrap>
        <BandHead />
        <CmsList
          f="items"
          className="tiles quotes"
          itemAs="figure"
          itemClassName="quote"
          renderItem={() => (
            <>
              <CmsText f="quote" as="blockquote" />
              <figcaption>
                <CmsImage f="avatar" className="quote__avatar" />
                <CmsText f="author" className="quote__author" />
                <CmsText f="role" className="agate" />
              </figcaption>
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

export function Logos() {
  return (
    <div className="band band--tight">
      <Wrap>
        <div className="band__head">
          <CmsText f="heading" as="h2" />
        </div>
        <CmsList
          f="logos"
          className="tiles logos"
          itemClassName="logo"
          renderItem={() => (
            <>
              <CmsImage f="image" />
              <CmsText f="name" className="agate" />
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

export function MediaImage() {
  return (
    <div className="band band--tight">
      <Wrap>
        <div className="media tile-photo">
          <CmsImage f="image" as={WideImg} />
        </div>
      </Wrap>
    </div>
  );
}

function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return '';
}

export function Video({ data }: CmsBlockProps) {
  const url = String(data.url || '');
  const embed = embedUrl(url);
  return (
    <div className="band">
      <Wrap>
        <div className="band__head">
          <CmsText f="heading" as="h2" />
        </div>
        <Frame className="video">
          {embed ? (
            <iframe src={embed} title={data.heading || 'Video'} allow="fullscreen; picture-in-picture" loading="lazy" />
          ) : url ? (
            <video src={url} controls preload="none" poster={data.poster || undefined} />
          ) : (
            <CmsField f="url" />
          )}
        </Frame>
      </Wrap>
    </div>
  );
}

export function Announcement() {
  return (
    <div className="announce announce--band">
      <CmsText f="text" />
      <CmsLink f="link" className="announce__link" />
    </div>
  );
}

export function Hours() {
  return (
    <div className="band">
      <Wrap className="wrap--narrow">
        <Frame className="form-frame">
          <CmsText f="heading" as="h2" />
          <CmsList
            f="rows"
            as="dl"
            className="spec"
            wrap={false}
            renderItem={(_, i, h) => (
              <React.Fragment key={i}>
                <dt {...h.attrs}>
                  <Clock aria-hidden="true" size={14} /> <CmsText f="day" />
                </dt>
                <dd>
                  <CmsText f="hours" />
                </dd>
              </React.Fragment>
            )}
          />
          <CmsText f="note" as="p" className="agate" />
        </Frame>
      </Wrap>
    </div>
  );
}

export function Locations() {
  return (
    <div className="band">
      <Wrap>
        <BandHead />
        <CmsList
          f="locations"
          className="tiles features features--3"
          itemClassName="feature"
          renderItem={() => (
            <>
              <span className="feature__icon">
                <MapPin aria-hidden="true" />
              </span>
              <CmsText f="name" as="h3" />
              <CmsText f="address" as="p" />
              <CmsText f="city" as="p" className="agate" />
              <CmsText f="phone" as="p" className="agate" />
              <CmsText f="hours" as="p" className="agate" />
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

export function Team() {
  return (
    <div className="band">
      <Wrap>
        <BandHead />
        <CmsList
          f="items"
          className="tiles catalog"
          itemClassName="person"
          renderItem={() => (
            <>
              <span className="person__photo tile-photo">
                <CmsImage f="photo" as={ThirdImg} />
              </span>
              <span className="person__body">
                <CmsText f="name" as="h3" />
                <CmsText f="role" className="agate" />
                <CmsText f="bio" as="p" />
              </span>
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

/** Respaldo para cualquier otro bloque: cada campo con su primitivo editable, dentro de una cartela. */
export function GenericSection({ data }: CmsBlockProps) {
  const keys = Object.keys(data).filter((k) => !k.startsWith('_') && !/Alt$|Focal$/.test(k) && !['tone', 'anchor', 'columns', 'layout', 'variant', 'imageSide', 'formName', 'source'].includes(k));
  const scalar = keys.filter((k) => !Array.isArray(data[k]) && typeof data[k] !== 'boolean' && typeof data[k] !== 'number');
  const lists = keys.filter((k) => Array.isArray(data[k]) && data[k].some((x: unknown) => x && typeof x === 'object'));
  return (
    <div className="band">
      <Wrap>
        <Frame className="generic">
          {scalar.map((k) => (
            <CmsField key={k} f={k} as={k === 'heading' || k === 'headline' || k === 'title' ? 'h2' : 'div'} className={`generic__${k}`} />
          ))}
          {lists.map((k) => (
            <CmsList
              key={k}
              f={k}
              className="tiles generic__list"
              itemClassName="generic__item"
              renderItem={(it: any) => (
                <>
                  {Object.keys(it || {})
                    .filter((sub) => !/Alt$|Focal$/.test(sub) && typeof it[sub] !== 'boolean' && !Array.isArray(it[sub]))
                    .map((sub) => (
                      <CmsField key={sub} f={sub} as="div" />
                    ))}
                </>
              )}
            />
          ))}
        </Frame>
      </Wrap>
    </div>
  );
}
