export type NotificationType = {
  label: string;
  type: string;
  default: boolean;
  template: {
    subject: string;
    message: string;
    type: string;
  };
  times?: Array<{ unit: string; value: number }>;
  recipients?: Array<string>;
};

export type NoticeMessage = {
  type: 'success' | 'error';
  title: string;
  message: string;
}; 