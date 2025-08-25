export type FieldType = {
  label: string;
  type: string;
  required: boolean;
  group: string;
  event_location: string;
  placeholder: string;
  helpText: string;
  order: number;
  enabled?: boolean;
  settings?: {
    options?: string[];
    min?: number;
    max?: number;
    format?: string;
    maxFileSize?: number;
    maxFileCount?: number;
    allowedFiles?: string[];
    termsText?: string;
  };
};

export type Fields = {
  system: FieldsGroup;
  location: FieldsGroup;
  custom: FieldsGroup;
  other?: FieldsGroup;
};

export type FieldsGroup = {
  [key: string]: FieldType;
}; 