from django.db import models
from wagtail.fields import StreamField
from wagtail.models import Page
from wagtail.admin.panels import FieldPanel, MultiFieldPanel
from wagtail.snippets.models import register_snippet
from . import blocks


@register_snippet
class FaviconSnippet(models.Model):
    title = models.CharField(
        max_length=255,
        help_text="Internal title for identifying this favicon in the CMS (not shown on site)."
    )

    favicon = StreamField(
        [('Favicon', blocks.FaviconBlock())],  # Fixed: Instantiate the block
        use_json_field=True,
        blank=True,
        help_text="Upload the favicon image for the browser tab icon."
    )

    panels = [
        FieldPanel('title'),
        FieldPanel('favicon'),
    ]

    def __str__(self):
        return f"{self.title}"

    class Meta:
        verbose_name = "Favicon Snippet"
        verbose_name_plural = "Favicon Snippets"


@register_snippet
class NavbarSnippet(models.Model):
    title = models.CharField(
        max_length=255,
        help_text="Internal title for identifying this navbar in the CMS (not shown on site)."
    )

    navbar = StreamField(
        [('Navbar', blocks.NavbarBlock())],  # Fixed: Instantiate the block
        use_json_field=True,
        blank=True,
        help_text="Navigation bar details including logo, brand name, and links."
    )

    panels = [
        FieldPanel('title'),
        FieldPanel('navbar'),
    ]

    def __str__(self):
        return f"{self.title}"

    class Meta:
        verbose_name = "Navbar Snippet"
        verbose_name_plural = "Navbar Snippets"


class HomePage(Page):
    navbar_snippet = models.ForeignKey(
        'NavbarSnippet',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text="Select which navigation bar snippet to display."
    )

    favicon_snippet = models.ForeignKey(
        'FaviconSnippet',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+',
        help_text="Select which favicon snippet to display."
    )

    content_panels = Page.content_panels + [
        MultiFieldPanel([
            FieldPanel('navbar_snippet'),
        ], heading="Header Settings"),
        MultiFieldPanel([
            FieldPanel('favicon_snippet'),
        ], heading="Favicon Settings"),
    ]

    class Meta:
        verbose_name = "Home Page"
        verbose_name_plural = "Home Pages"