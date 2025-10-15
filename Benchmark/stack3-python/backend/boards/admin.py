from django.contrib import admin
from .models import Board, List, Card


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at', 'updated_at']
    search_fields = ['title', 'description']


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ['title', 'board', 'position', 'created_at']
    list_filter = ['board']
    search_fields = ['title']


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['title', 'list', 'position', 'created_at']
    list_filter = ['list__board']
    search_fields = ['title', 'description']
