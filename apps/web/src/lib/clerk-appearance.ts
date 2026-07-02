export const vivuClerkAppearance = {
  variables: {
    borderRadius: '8px',
    colorBackground: 'transparent',
    colorDanger: 'rgb(var(--color-error))',
    colorInputBackground: 'rgb(var(--color-surface-container-low))',
    colorInputText: 'rgb(var(--color-on-surface))',
    colorPrimary: 'rgb(var(--color-primary))',
    colorText: 'rgb(var(--color-on-surface))',
    colorTextOnPrimaryBackground: 'rgb(var(--color-on-primary))',
    colorTextSecondary: 'rgb(var(--color-on-surface-variant))',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    fontFamilyButtons: 'var(--font-inter), system-ui, sans-serif',
  },
  elements: {
    rootBox: 'w-full',
    cardBox: 'w-full border-0 bg-transparent shadow-none',
    card: 'w-full border-0 bg-transparent p-0 shadow-none',
    header: 'mb-6 text-center sm:text-left',
    headerTitle: 'text-h3 font-bold text-on-surface',
    headerSubtitle: 'mt-2 text-body-md leading-relaxed text-on-surface-variant',
    footer: 'pt-4 !bg-none !bg-transparent',
    footerAction: 'bg-transparent',
    footerActionText: 'text-on-surface-variant',
    footerActionLink: 'font-semibold text-primary hover:text-primary-container',
    footerItem: '!bg-transparent text-on-surface-variant',
    form: 'gap-4',
    formField: 'gap-2',
    formFieldLabel: 'font-label-caps text-on-surface-variant',
    formFieldInput:
      'min-h-12 rounded border border-outline-variant/40 bg-surface-container-low px-4 text-body-md text-on-surface shadow-none outline-none transition focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/25',
    formFieldInputShowPasswordButton: 'text-on-surface-variant hover:text-primary',
    formButtonPrimary:
      'min-h-12 rounded bg-primary font-semibold text-on-primary shadow-card transition hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest',
    socialButtonsBlockButton:
      'min-h-12 rounded border border-outline-variant/50 bg-surface-container-lowest text-body-md font-semibold text-on-surface shadow-none transition hover:bg-surface-container-low',
    socialButtonsBlockButtonText: 'font-semibold',
    dividerLine: 'bg-outline-variant/50',
    dividerText: 'font-label-caps text-outline',
    identityPreview: 'rounded border border-outline-variant/40 bg-surface-container-low',
    identityPreviewText: 'text-on-surface',
    identityPreviewEditButton: 'text-primary',
    alert: 'rounded border border-error/20 bg-error-container text-on-error-container',
    formResendCodeLink: 'font-semibold text-primary',
    otpCodeFieldInputs: 'justify-center gap-2 sm:justify-start',
    otpCodeFieldInputContainer: 'rounded bg-transparent shadow-none',
    otpCodeFieldInput:
      'h-12 w-11 rounded border-2 !border-outline-variant !bg-surface-container-lowest text-center text-h4 font-bold !text-on-surface caret-primary shadow-sm outline-none focus:!border-primary focus:ring-4 focus:ring-primary/20',
  },
} as const;

export const vivuClerkUserButtonAppearance = {
  variables: {
    borderRadius: '8px',
    colorPrimary: 'rgb(var(--color-primary))',
    colorText: 'rgb(var(--color-on-surface))',
    colorTextSecondary: 'rgb(var(--color-on-surface-variant))',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
  },
  elements: {
    avatarBox:
      'h-9 w-9 rounded-full ring-2 ring-outline-variant/30 transition hover:ring-primary/50',
    userButtonPopoverCard:
      'rounded border border-outline-variant/30 bg-surface text-on-surface shadow-xl',
    userButtonPopoverActionButton:
      'text-on-surface hover:bg-surface-container-low focus:bg-surface-container-low',
    userButtonPopoverActionButtonText: 'text-body-md',
    userButtonPopoverFooter: 'hidden',
  },
} as const;
