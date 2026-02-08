"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/label";
import { Globe, Plus, Check } from "lucide-react";

const DomainsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Domains</h1>
          <p className="text-muted-foreground">Manage custom domains for your short links</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Domain
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Domain</CardTitle>
          <CardDescription>This is your current active domain for shortened links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{typeof window !== 'undefined' ? window.location.host : 'linkio.app'}</div>
                <div className="text-sm text-muted-foreground">Default domain</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Domains</CardTitle>
          <CardDescription>Add your own domain to create branded short links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No custom domains yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Add your own custom domain to create branded short links that match your brand identity
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Domain
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to add a custom domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Purchase a domain</h4>
              <p className="text-sm text-muted-foreground">
                Get a domain from any registrar like Namecheap, GoDaddy, or Cloudflare
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1">Add domain to LINKIO</h4>
              <p className="text-sm text-muted-foreground">
                Click "Add Domain" and enter your custom domain name
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1">Configure DNS records</h4>
              <p className="text-sm text-muted-foreground">
                Add the provided DNS records to your domain registrar
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h4 className="font-medium mb-1">Verify and activate</h4>
              <p className="text-sm text-muted-foreground">
                We'll verify your DNS configuration and activate your custom domain
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainsPage;
