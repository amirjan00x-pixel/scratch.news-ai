import { Twitter, Facebook, Linkedin, Link2, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(shareLinks.twitter, "_blank")}
        className="h-8 w-8 p-0"
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(shareLinks.facebook, "_blank")}
        className="h-8 w-8 p-0"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(shareLinks.linkedin, "_blank")}
        className="h-8 w-8 p-0"
      >
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.open(shareLinks.email, "_blank")}
        className="h-8 w-8 p-0"
      >
        <Mail className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="h-8 w-8 p-0"
      >
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
