from wagtail import blocks
from wagtail.images.blocks import ImageChooserBlock
from wagtail.documents.blocks import DocumentChooserBlock

class NavbarBlock(blocks.StructBlock):
    brand_name = blocks.CharBlock(required=True, help_text="Enter the foundation or organization name")
    logo = ImageChooserBlock(required=True, help_text="Upload the logo for the foundation or organization")
    links = blocks.ListBlock(
        blocks.StructBlock([
            ('link_text', blocks.CharBlock(required=True, help_text="Text for the link")),
            ('link_url', blocks.URLBlock(required=True, help_text="URL for the link"))
        ]),
        help_text="Add Navigation links for the main menu"
    )
    button = blocks.CharBlock(
        required=False,
        default="Donate",
        help_text="Text to display on the donation button."
    )

    button_url = blocks.URLBlock(
        required=False,
        default="/donate/",
        help_text="URL for the donation button."
    )

    class Meta:
        template = "home/navbar.html"
        icon = "site"
        label = "Navigation Bar"

class FaviconBlock(blocks.StructBlock):
    favicon = DocumentChooserBlock(
        required=True,
        help_text="Upload a .ico or .png file for the favicon"
    )

    class Meta:
        template = "home/favicon.html"
        icon = "pick"
        label = "Favicon"
        