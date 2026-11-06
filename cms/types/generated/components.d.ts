import type { Schema, Struct } from '@strapi/strapi';

export interface ElementsCallout extends Struct.ComponentSchema {
  collectionName: 'components_elements_callouts';
  info: {
    displayName: 'Hero callout';
    icon: 'pin';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    text: Schema.Attribute.String;
  };
}

export interface ElementsColorOption extends Struct.ComponentSchema {
  collectionName: 'components_elements_color_options';
  info: {
    displayName: 'Colour option';
    icon: 'brush';
  };
  attributes: {
    caption: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    swatch: Schema.Attribute.String;
  };
}

export interface ElementsPartMark extends Struct.ComponentSchema {
  collectionName: 'components_elements_part_marks';
  info: {
    displayName: 'Pen part mark';
    icon: 'pin';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    part: Schema.Attribute.Enumeration<
      ['nib', 'grip', 'button', 'body', 'clip', 'cap']
    > &
      Schema.Attribute.Required;
    text: Schema.Attribute.String;
  };
}

export interface ElementsProduct extends Struct.ComponentSchema {
  collectionName: 'components_elements_products';
  info: {
    displayName: 'Product';
    icon: 'archive';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsSlide extends Struct.ComponentSchema {
  collectionName: 'components_elements_slides';
  info: {
    displayName: 'Slide';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String & Schema.Attribute.Required;
    desktopImage: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    mobileImage: Schema.Attribute.Media<'images'>;
  };
}

export interface ElementsSpecGroup extends Struct.ComponentSchema {
  collectionName: 'components_elements_spec_groups';
  info: {
    displayName: 'Spec group';
    icon: 'cog';
  };
  attributes: {
    items: Schema.Attribute.Component<'shared.text-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ElementsTile extends Struct.ComponentSchema {
  collectionName: 'components_elements_tiles';
  info: {
    displayName: 'Image tile';
    icon: 'picture';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsAudience extends Struct.ComponentSchema {
  collectionName: 'components_sections_audiences';
  info: {
    displayName: "Who it's for";
    icon: 'user';
  };
  attributes: {
    anchor: Schema.Attribute.String & Schema.Attribute.DefaultTo<'who-its-for'>;
    cards: Schema.Attribute.Component<'shared.card', true>;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    lede: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsClosing extends Struct.ComponentSchema {
  collectionName: 'components_sections_closings';
  info: {
    displayName: 'Closing statement';
    icon: 'quote';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface SectionsFeatureBlock extends Struct.ComponentSchema {
  collectionName: 'components_sections_feature_blocks';
  info: {
    displayName: 'Feature block';
    icon: 'layout';
  };
  attributes: {
    anchor: Schema.Attribute.String;
    body: Schema.Attribute.Text;
    bookScene: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    coverImage: Schema.Attribute.Media<'images'>;
    depthScene: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    paperImage: Schema.Attribute.Media<'images'>;
    paperScene: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    secondImage: Schema.Attribute.Media<'images'>;
    secondImageAlt: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heros';
  info: {
    displayName: 'Hero';
    icon: 'star';
  };
  attributes: {
    callouts: Schema.Attribute.Component<'elements.callout', true>;
    eyebrow: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    scrollLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Scroll'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsInsideBox extends Struct.ComponentSchema {
  collectionName: 'components_sections_inside_boxs';
  info: {
    displayName: 'Inside the box';
    icon: 'archive';
  };
  attributes: {
    anchor: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'inside-the-box'>;
    colors: Schema.Attribute.Component<'elements.color-option', true>;
    description: Schema.Attribute.Text;
    heading: Schema.Attribute.String;
    intro: Schema.Attribute.Text;
    products: Schema.Attribute.Component<'elements.product', true>;
    tiles: Schema.Attribute.Component<'elements.tile', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsSpecifications extends Struct.ComponentSchema {
  collectionName: 'components_sections_specificationss';
  info: {
    displayName: 'Specifications';
    icon: 'cog';
  };
  attributes: {
    anchor: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'specifications'>;
    eyebrow: Schema.Attribute.String;
    groups: Schema.Attribute.Component<'elements.spec-group', true>;
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    markers: Schema.Attribute.Component<'elements.part-mark', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsWorksWith extends Struct.ComponentSchema {
  collectionName: 'components_sections_works_withs';
  info: {
    displayName: 'Works with (slider)';
    icon: 'slideshow';
  };
  attributes: {
    anchor: Schema.Attribute.String & Schema.Attribute.DefaultTo<'about'>;
    body: Schema.Attribute.Text;
    label: Schema.Attribute.String;
    slides: Schema.Attribute.Component<'elements.slide', true>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_cards';
  info: {
    displayName: 'Card';
    icon: 'layout';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 170;
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 70;
      }>;
    noIndex: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_shared_team_members';
  info: {
    displayName: 'Team member';
    icon: 'user';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface SharedTextItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_text_items';
  info: {
    displayName: 'Text item';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'elements.callout': ElementsCallout;
      'elements.color-option': ElementsColorOption;
      'elements.part-mark': ElementsPartMark;
      'elements.product': ElementsProduct;
      'elements.slide': ElementsSlide;
      'elements.spec-group': ElementsSpecGroup;
      'elements.tile': ElementsTile;
      'sections.audience': SectionsAudience;
      'sections.closing': SectionsClosing;
      'sections.feature-block': SectionsFeatureBlock;
      'sections.hero': SectionsHero;
      'sections.inside-box': SectionsInsideBox;
      'sections.specifications': SectionsSpecifications;
      'sections.works-with': SectionsWorksWith;
      'shared.card': SharedCard;
      'shared.link': SharedLink;
      'shared.seo': SharedSeo;
      'shared.team-member': SharedTeamMember;
      'shared.text-item': SharedTextItem;
    }
  }
}
