import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      closeButton
      duration={4200}
      gap={10}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            "group toast min-h-12 rounded-lg border bg-card px-4 py-3 text-card-foreground shadow-xl shadow-black/10 ring-1 ring-black/5 backdrop-blur-sm",
          title: "text-sm font-semibold leading-5 text-foreground",
          description: "text-sm leading-5 text-muted-foreground",
          content: "min-w-0 gap-0",
          icon: "mt-0.5",
          closeButton:
            "border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground",
          actionButton:
            "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          cancelButton:
            "rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground",
          default: "border-border",
          success:
            "border-emerald-200 bg-emerald-50 text-emerald-950 [--normal-bg:theme(colors.emerald.50)] [--normal-border:theme(colors.emerald.200)] [--normal-text:theme(colors.emerald.950)] dark:border-emerald-900/70 dark:bg-emerald-950 dark:text-emerald-50",
          info: "border-sky-200 bg-sky-50 text-sky-950 [--normal-bg:theme(colors.sky.50)] [--normal-border:theme(colors.sky.200)] [--normal-text:theme(colors.sky.950)] dark:border-sky-900/70 dark:bg-sky-950 dark:text-sky-50",
          warning:
            "border-amber-200 bg-amber-50 text-amber-950 [--normal-bg:theme(colors.amber.50)] [--normal-border:theme(colors.amber.200)] [--normal-text:theme(colors.amber.950)] dark:border-amber-900/70 dark:bg-amber-950 dark:text-amber-50",
          error:
            "border-red-200 bg-red-50 text-red-950 [--normal-bg:theme(colors.red.50)] [--normal-border:theme(colors.red.200)] [--normal-text:theme(colors.red.950)] dark:border-red-900/70 dark:bg-red-950 dark:text-red-50",
          loading:
            "border-border bg-card text-card-foreground [--normal-bg:theme(colors.white)] [--normal-border:theme(colors.neutral.200)] [--normal-text:theme(colors.neutral.950)] dark:[--normal-bg:theme(colors.neutral.950)] dark:[--normal-border:theme(colors.neutral.800)] dark:[--normal-text:theme(colors.neutral.50)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
