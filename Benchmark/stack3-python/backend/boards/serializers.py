from rest_framework import serializers
from .models import Board, List, Card


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ['id', 'title', 'description', 'position', 'list', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ['id', 'title', 'position', 'board', 'cards', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'title', 'description', 'lists', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class BoardListSerializer(serializers.ModelSerializer):
    """Simplified serializer for board list view"""
    lists_count = serializers.SerializerMethodField()

    class Meta:
        model = Board
        fields = ['id', 'title', 'description', 'lists_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_lists_count(self, obj):
        return obj.lists.count()
