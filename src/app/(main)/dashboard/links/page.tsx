"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, ExternalLink, QrCode, Trash2, BarChart3, LoaderIcon, Plus, ShieldCheck } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLinksStore } from "@/store/use-links-store";

const LinksPage = () => {
  const { links, isLoading: storeLoading, setLinks, addLink, removeLink, setLoading } = useLinksStore();

  const [url, setUrl] = useState<string>("");
  const [customKey, setCustomKey] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQrDialog, setShowQrDialog] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; linkId: string; linkKey: string }>({
    show: false,
    linkId: "",
    linkKey: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/links");
      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          customKey: customKey || undefined,
          password: password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to create link");
        return;
      }

      addLink(data.link);
      toast.success("Link created successfully!");
      setUrl("");
      setCustomKey("");
      setPassword("");
      setShowCreateForm(false);
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLink = async () => {
    const id = deleteConfirm.linkId;
    setDeletingId(id);

    try {
      const response = await fetch(`/api/links/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to delete link");
        return;
      }

      removeLink(id);
      toast.success("Link deleted successfully!");
      setDeleteConfirm({ show: false, linkId: "", linkKey: "" });
    } catch (error) {
      toast.error("An error occurred. Please try again");
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteConfirm = (linkId: string, linkKey: string) => {
    setDeleteConfirm({ show: true, linkId, linkKey });
  };

  const handleCopyLink = (key: string) => {
    const fullUrl = `${window.location.origin}/${key}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleGenerateQR = async (key: string) => {
    try {
      const response = await fetch(`/api/qr?key=${key}`);
      const data = await response.json();
      
      if (response.ok) {
        setQrCodeUrl(data.qrCode);
        setShowQrDialog(true);
      } else {
        toast.error("Failed to generate QR code");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Links</h1>
          <p className="text-muted-foreground">Create and manage your shortened links</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New Link
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create Short Link</CardTitle>
            <CardDescription>
              Shorten your long URLs and track their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Destination URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-long-url"
                  disabled={isCreating}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customKey">Custom Key (Optional)</Label>
                  <Input
                    id="customKey"
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="my-custom-link"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for random key
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password Protection (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-muted-foreground">
                    Protect your link with a password
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Short Link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setUrl("");
                    setCustomKey("");
                    setPassword("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Links ({links.length})</CardTitle>
          <CardDescription>
            Manage and track all your shortened links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {storeLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderIcon className="w-8 h-8 animate-spin" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No links created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first link to get started
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Link
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Link</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link) => (
                    <TableRow key={link.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">/{link.key}</span>
                          {link.password && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Protected
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate text-muted-foreground">
                          {link.url}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{link.clicks}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(link.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopyLink(link.key)}
                            title="Copy link"
                            disabled={deletingId === link.id}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleGenerateQR(link.key)}
                            title="Generate QR code"
                            disabled={deletingId === link.id}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(`/${link.key}`, '_blank')}
                            title="Open link"
                            disabled={deletingId === link.id}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDeleteConfirm(link.id, link.key)}
                            title="Delete link"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === link.id}
                          >
                            {deletingId === link.id ? (
                              <LoaderIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to access your link
            </DialogDescription>
          </DialogHeader>
          {qrCodeUrl && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <Button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrCodeUrl;
                  a.download = 'qr-code.png';
                  a.click();
                  toast.success("QR code downloaded!");
                }}
                className="w-full"
              >
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirm.show} onOpenChange={(open) => !deletingId && setDeleteConfirm({ ...deleteConfirm, show: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to delete the link <span className="font-mono font-semibold text-foreground">/{deleteConfirm.linkKey}</span>? 
              This action cannot be undone and all analytics data for this link will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteLink();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletingId !== null}
            >
              {deletingId ? (
                <>
                  <LoaderIcon className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Link"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LinksPage;
