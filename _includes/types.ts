export interface SiteData {
  title: string;
  description: string;
  url: string;
}

export interface DefaultData {
  title?: string;
  classname?: string;
  content: string;
  site: SiteData;
}

export interface PostData {
  title: string;
  categories?: string[];
  tags?: string[];
  oneliner?: string;
  type?: string;
  projecturl?: string;
  image?: Array<{ src: string; alt: string }>;
  content: string;
  page: { url: string; date: Date };
}
