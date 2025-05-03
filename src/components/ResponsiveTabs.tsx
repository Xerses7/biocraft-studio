'use client';

import * as React from "react";
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ResponsiveTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  id?: string;
}

interface ResponsiveTabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface ResponsiveTabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

interface ResponsiveTabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const ResponsiveTabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: "",
  onValueChange: () => {},
});

export function ResponsiveTabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  id,
  ...props
}: ResponsiveTabsProps) {
  const [tabValue, setTabValue] = React.useState(value || defaultValue);
  const isMobile = useIsMobile();

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setTabValue(newValue);
      onValueChange?.(newValue);
    },
    [onValueChange]
  );

  React.useEffect(() => {
    if (value) {
      setTabValue(value);
    }
  }, [value]);

  return (
    <ResponsiveTabsContext.Provider
      value={{ value: tabValue, onValueChange: handleValueChange }}
    >
      <div className={cn("w-full", className)} id={id} {...props}>
        {children}
      </div>
    </ResponsiveTabsContext.Provider>
  );
}

export function ResponsiveTabsList({
  className,
  children,
  ...props
}: ResponsiveTabsListProps) {
  const isMobile = useIsMobile();
  const { value, onValueChange } = React.useContext(ResponsiveTabsContext);
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Find the currently selected tab label
  const selectedTabLabel = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.value === value
  );
  
  const selectedLabel = React.isValidElement(selectedTabLabel) 
    ? selectedTabLabel.props.children 
    : 'Select Tab';

  if (isMobile) {
    return (
      <div className="relative mb-4" {...props}>
        <button
          className="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <span>{selectedLabel}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 z-20 mt-1 w-full rounded-md border bg-popover shadow-md">
              {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  // Get the value from the child
                  const childValue = child.props.value;
                  
                  return React.cloneElement(child as React.ReactElement<any>, {
                    onClick: () => {
                      // Call the original onClick if it exists
                      child.props.onClick?.();
                      
                      // Update the tab value through context
                      onValueChange(childValue);
                      
                      // Close the dropdown
                      setIsOpen(false);
                    },
                    className: cn(
                      "block w-full text-left px-4 py-2",
                      value === childValue 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                    ),
                  });
                }
                return child;
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ResponsiveTabsTrigger({
  className,
  value,
  ...props
}: ResponsiveTabsTriggerProps) {
  const { value: contextValue, onValueChange } = React.useContext(ResponsiveTabsContext);
  const isMobile = useIsMobile();
  
  if (isMobile) {
    const isActive = contextValue === value;
    return (
      <button
        type="button"
        className={cn(
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      />
    );
  }

  return (
    <button
      type="button"
      role="tab"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        contextValue === value
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    />
  );
}

export function ResponsiveTabsContent({
  className,
  value,
  ...props
}: ResponsiveTabsContentProps) {
  const { value: contextValue } = React.useContext(ResponsiveTabsContext);
  
  return contextValue === value ? (
    <div
      role="tabpanel"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  ) : null;
}